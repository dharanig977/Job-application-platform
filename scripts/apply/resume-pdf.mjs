// Turn a resume's plain text into a clean, ATS-readable PDF for upload.
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function toHtml(text) {
  const lines = text.split("\n");
  const body = lines
    .map((line, i) => {
      const t = line.trim();
      if (!t) return "";
      if (i === 0) return `<h1>${esc(t)}</h1>`;
      if (/^[-•*]\s+/.test(t)) return `<li>${esc(t.replace(/^[-•*]\s+/, ""))}</li>`;
      // Short all-caps or title-like lines with no period read as headings.
      if (t.length < 40 && !/[.,;]$/.test(t) && (t === t.toUpperCase() || /^[A-Z][A-Za-z &/]+:?$/.test(t))) return `<h2>${esc(t.replace(/:$/, ""))}</h2>`;
      return `<p>${esc(t)}</p>`;
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  return `<!doctype html><meta charset="utf-8"><style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.35; color: #111; }
    h1 { font-size: 18pt; margin: 0 0 4pt; } h2 { font-size: 11.5pt; margin: 12pt 0 4pt; border-bottom: 1px solid #999; text-transform: uppercase; }
    p { margin: 2pt 0; } ul { margin: 2pt 0 2pt 16pt; padding: 0; } li { margin: 1pt 0; }
  </style>${body}`;
}

// Writes the resume to `path`: the original upload when it's the untouched
// master, otherwise a PDF rendered from the tailored text.
export async function writeResumeFile(resume, dir, fullName) {
  const base = fullName ? `${fullName.replace(/[^A-Za-z0-9]+/g, "_")}_Resume` : "Resume";
  if (resume.isMaster && resume.fileData) {
    const ext = (resume.fileName?.split(".").pop() || "pdf").toLowerCase();
    const path = `${dir}/${base}.${ext}`;
    await writeFile(path, resume.fileData);
    return path;
  }
  const path = `${dir}/${base}.pdf`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  await page.setContent(toHtml(resume.content));
  await page.pdf({ path, format: "Letter", margin: { top: "0.6in", bottom: "0.6in", left: "0.7in", right: "0.7in" } });
  await browser.close();
  return path;
}
