// Apply agent worker. Takes queued jobs (best ATS score first), renders the
// resume version chosen for each, and has a browser agent fill in the
// company's application portal. Submits on its own when auto-submit is on;
// otherwise stops at the final step and waits for your approval in the app.
//
// Env: DATABASE_URL, CLAUDE_CODE_OAUTH_TOKEN, PORTAL_PASSWORD (a password
// used only for creating job-portal accounts), APPLY_PER_RUN (default 2).
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { portalOf, runApplyAgent } from "./apply/agent.mjs";
import { writeResumeFile } from "./apply/resume-pdf.mjs";

const prisma = new PrismaClient();
const PER_RUN = Number(process.env.APPLY_PER_RUN ?? 2);
// Settings and internal fields the portal never needs.
const PRIVATE_KEYS = ["watchBoards", "autoSubmit", "dailyLimit", "minAtsScore", "excludeKeywords", "keywords"];

async function log(applicationId, message) {
  await prisma.applicationLog.create({ data: { applicationId, message } });
}

async function main() {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    return console.log("CLAUDE_CODE_OAUTH_TOKEN is not set; the apply agent is off.");
  }
  const profileRow = await prisma.profile.findUnique({ where: { id: 1 } });
  const answers = profileRow?.answers ?? {};
  const autoSubmit = (answers.autoSubmit || "Yes") === "Yes";
  const dailyLimit = Number(answers.dailyLimit || 25);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const submittedToday = await prisma.application.count({ where: { status: "submitted", appliedAt: { gte: startOfDay } } });
  let budget = Math.min(PER_RUN, dailyLimit - submittedToday);
  if (budget <= 0) return console.log(`Daily limit of ${dailyLimit} applications reached.`);

  const profile = Object.fromEntries(Object.entries(answers).filter(([k, v]) => v && !PRIVATE_KEYS.includes(k)));
  const extras = await prisma.answer.findMany();

  // Applications you approved go first, then new queued jobs.
  const approved = await prisma.application.findMany({ where: { status: "approved" }, include: { job: true }, take: budget });
  const fresh = await prisma.job.findMany({
    where: { status: "queued", applications: { none: {} } },
    orderBy: [{ atsScore: "desc" }, { postedAt: "desc" }],
    take: budget,
  });
  const work = [
    ...approved.map((a) => ({ job: a.job, application: a, submit: true })),
    ...fresh.map((job) => ({ job, application: null, submit: autoSubmit })),
  ].slice(0, budget);

  for (const item of work) {
    const { job, submit } = item;
    const resumeId = job.ats?.resumeId;
    const resume = resumeId ? await prisma.resume.findUnique({ where: { id: resumeId } }) : await prisma.resume.findFirst({ where: { isMaster: true } });
    const application =
      item.application ??
      (await prisma.application.create({ data: { jobId: job.id, resumeId: resume?.id, portal: portalOf(job.url), status: "in_progress" } }));
    if (item.application) await prisma.application.update({ where: { id: application.id }, data: { status: "in_progress" } });
    await log(application.id, submit ? "Started applying" : "Started filling in (will wait for your approval)");

    try {
      const workDir = await mkdtemp(join(tmpdir(), "apply-"));
      const resumePath = await writeResumeFile(resume, workDir, `${answers.firstName ?? ""} ${answers.lastName ?? ""}`.trim());
      await log(application.id, `Prepared resume: ${resume.label}${resume.atsScore ? ` (ATS ${resume.atsScore})` : ""}`);

      const result = await runApplyAgent({
        workDir, job, profile, extras, resumePath, submit,
        portalEmail: answers.email,
        portalPassword: process.env.PORTAL_PASSWORD,
      });

      for (const step of result.steps ?? []) await log(application.id, step);
      for (const question of result.unanswered ?? []) {
        const exists = await prisma.answer.findFirst({ where: { question } });
        if (!exists) await prisma.answer.create({ data: { category: "From portals", question, answer: "" } });
      }
      const status = ["submitted", "pending_approval", "needs_you", "failed"].includes(result.status) ? result.status : "failed";
      await prisma.application.update({
        where: { id: application.id },
        data: { status, portal: result.portal || application.portal, appliedAt: status === "submitted" ? new Date() : null },
      });
      await prisma.job.update({ where: { id: job.id }, data: { status: status === "submitted" ? "applied" : status, note: result.note || null } });
      await log(application.id, result.note || `Finished: ${status}`);
      console.log(`${job.title} @ ${job.company}: ${status}`);
    } catch (err) {
      const message = String(err.message ?? err).slice(0, 400);
      await prisma.application.update({ where: { id: application.id }, data: { status: "failed" } });
      await prisma.job.update({ where: { id: job.id }, data: { status: "failed", note: message } });
      await log(application.id, `Failed: ${message}`);
      console.log(`${job.title} @ ${job.company}: failed (${message})`);
    }
    budget--;
  }
}

main().finally(() => prisma.$disconnect());
