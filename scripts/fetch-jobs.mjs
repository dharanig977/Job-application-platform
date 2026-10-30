// Job feed worker. Runs on a schedule (see .github/workflows/job-feed.yml):
// pulls new jobs from every configured source, keeps the ones matching the
// profile, and saves them. Safe to re-run: already-seen jobs are skipped.
//
// Env: DATABASE_URL, optional JSEARCH_API_KEY, ADZUNA_APP_ID/ADZUNA_APP_KEY.
// INCLUDE_AGGREGATORS=1 also queries the aggregators. To stay inside
// JSearch's free tier, each run sends one JSearch request, rotating through
// the target titles.
import { PrismaClient } from "@prisma/client";
import { BOARD_FETCHERS, adzuna, jsearch } from "./feed/sources.mjs";
import { buildFilter, list } from "./feed/filter.mjs";

const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  const answers = profile?.answers ?? {};
  const roles = list(answers.targetRoles);
  if (roles.length === 0) {
    console.log("No target job titles in the profile yet; nothing to search for.");
    return;
  }

  const tasks = [];
  // "greenhouse:stripe" style lines from the profile.
  for (const line of list(answers.watchBoards)) {
    const [kind, board] = line.split(":").map((s) => s.trim());
    const fetcher = BOARD_FETCHERS[kind?.toLowerCase()];
    if (fetcher && board) tasks.push({ name: line, run: () => fetcher(board) });
    else console.warn(`Skipping board "${line}": use greenhouse:, lever: or ashby: followed by the board name.`);
  }

  if (process.env.INCLUDE_AGGREGATORS === "1") {
    const where = list(answers.targetLocations)[0];
    const runIndex = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
    const jsearchRole = roles[runIndex % roles.length];
    const query = where ? `${jsearchRole} in ${where}` : jsearchRole;
    if (process.env.JSEARCH_API_KEY) tasks.push({ name: `jsearch "${query}"`, run: () => jsearch(query, process.env.JSEARCH_API_KEY) });
    for (const role of roles) {
      if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
        tasks.push({ name: `adzuna "${role}"`, run: () => adzuna(role, process.env.ADZUNA_APP_ID, process.env.ADZUNA_APP_KEY) });
      }
    }
  }

  const match = buildFilter(answers);
  const summary = {};
  let found = 0;
  let added = 0;

  for (const task of tasks) {
    try {
      const jobs = await task.run();
      const matched = [];
      for (const job of jobs) {
        const category = match(job);
        if (category && job.url && !Number.isNaN(job.postedAt.getTime())) matched.push({ ...job, category });
      }
      const result = await prisma.job.createMany({ data: matched, skipDuplicates: true });
      summary[task.name] = { fetched: jobs.length, matched: matched.length, added: result.count };
      found += matched.length;
      added += result.count;
    } catch (err) {
      summary[task.name] = { error: String(err.message ?? err) };
    }
  }

  await prisma.feedRun.create({ data: { found, added, summary } });
  console.log(JSON.stringify({ found, added, summary }, null, 2));
}

main().finally(() => prisma.$disconnect());
