// Resume rewriting through Claude Code running headless. In GitHub Actions
// it signs in with CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`), so
// usage counts against your Claude plan instead of a separate API bill.
import { spawn } from "node:child_process";

export const canTailor = () => Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY);

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", "--output-format", "json", "--max-turns", "1"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 500)}`));
      try {
        const parsed = JSON.parse(out);
        if (parsed.is_error) return reject(new Error(String(parsed.result).slice(0, 500)));
        resolve(String(parsed.result ?? ""));
      } catch {
        reject(new Error(`unexpected claude output: ${out.slice(0, 500)}`));
      }
    });
    child.stdin.end(prompt);
  });
}

export async function tailorResume({ resume, job, add, forbidden }) {
  const prompt = `You are tailoring a resume so it passes an applicant tracking system (ATS) for one job, while staying completely truthful.

Rules:
- Keep every fact true: same employers, titles, dates, degrees and numbers. Never invent experience, projects, metrics or certifications.
- Work these keywords in naturally, using their exact spelling, where the candidate's existing experience supports them (the candidate has confirmed they have these skills): ${add.length ? add.join(", ") : "(none)"}.
- Never mention these, because the candidate does not have them: ${forbidden.length ? forbidden.join(", ") : "(none)"}.
- You may reorder bullets, rephrase them to mirror the job description's wording, and update the summary and skills section to lead with what this job asks for.
- Keep it about the same length as the original. Use plain text with simple section headings and "- " bullets, which ATS parsers read reliably.
- Reply with the resume text only: no preamble, notes or Markdown fences.

Job title: ${job.title}
Company: ${job.company}

Job description:
${job.description.slice(0, 12000)}

Current resume:
${resume}`;

  return (await runClaude(prompt)).trim();
}
