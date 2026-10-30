// Scores new jobs against the master resume and, when keywords you have are
// missing, writes a tailored version with Claude. Jobs that reach your
// minimum ATS score are queued for the apply agent; the rest are skipped
// with a note saying why.
//
// Env: DATABASE_URL; CLAUDE_CODE_OAUTH_TOKEN (or ANTHROPIC_API_KEY) to
// enable rewriting; TAILOR_PER_RUN (default 5).
import { PrismaClient } from "@prisma/client";
import { has, scoreResume } from "./tailor/ats.mjs";
import { canTailor, tailorResume } from "./tailor/claude.mjs";

const prisma = new PrismaClient();
const PER_RUN = Number(process.env.TAILOR_PER_RUN ?? 5);

async function main() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  const answers = profile?.answers ?? {};
  const master = await prisma.resume.findFirst({ where: { isMaster: true } });
  if (!master?.content) return console.log("No master resume uploaded yet.");

  const minScore = Number(answers.minAtsScore || 75);
  const dailyLimit = Number(answers.dailyLimit || 25);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const tailoredToday = await prisma.resume.count({ where: { isMaster: false, createdAt: { gte: startOfDay } } });
  const budget = Math.max(0, dailyLimit - tailoredToday);

  const jobs = await prisma.job.findMany({ where: { status: "new" }, orderBy: { postedAt: "desc" }, take: PER_RUN });
  let rewrites = 0;

  for (const job of jobs) {
    const before = scoreResume(master.content, job, answers);
    let content = master.content;
    let after = before;
    let note = null;

    const worthRewriting = before.supported.length > 0 || before.score < minScore;
    if (worthRewriting && canTailor() && rewrites < budget) {
      try {
        const draft = await tailorResume({ resume: master.content, job, add: before.supported, forbidden: before.unsupported });
        rewrites++;
        // Reject a draft that claims a skill you don't have.
        const invented = before.unsupported.filter((k) => has(draft, k));
        if (invented.length) {
          note = `Tailored draft rejected: it added ${invented.join(", ")}, which you haven't listed as skills.`;
        } else if (draft.length > master.content.length * 0.5) {
          content = draft;
          after = scoreResume(content, job, answers);
        }
      } catch (err) {
        note = `Tailoring failed: ${String(err.message ?? err).slice(0, 300)}`;
      }
    } else if (worthRewriting && canTailor()) {
      note = `Daily limit of ${dailyLimit} tailored resumes reached; scored with the master resume.`;
    }

    let resumeId = master.id;
    if (content !== master.content) {
      const version = await prisma.resume.create({
        data: { label: `${job.company} – ${job.title}`, content, jobId: job.id, atsScore: after.score },
      });
      resumeId = version.id;
    }

    const passes = after.score >= minScore;
    if (!passes) {
      const gap = after.unsupported.length ? ` Missing skills you haven't listed: ${after.unsupported.join(", ")}.` : "";
      note = `${note ? note + " " : ""}ATS score ${after.score} is below your minimum of ${minScore}.${gap}`;
    }

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: passes ? "queued" : "skipped",
        atsScore: after.score,
        ats: {
          before: before.score,
          resumeId,
          matched: after.matched,
          missing: after.missing,
          supported: after.supported,
          unsupported: after.unsupported,
        },
        note,
      },
    });
    console.log(`${job.title} @ ${job.company}: ${before.score} -> ${after.score} (${passes ? "queued" : "skipped"})`);
  }
}

main().finally(() => prisma.$disconnect());
