"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { QUESTION_IDS, type Answers } from "@/lib/questionnaire";
import { resumeText } from "@/lib/resume-text";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
// Vercel caps request bodies at 4.5 MB.
const MAX_RESUME_BYTES = 4 * 1024 * 1024;

export async function saveQuestionnaire(form: FormData) {
  const answers: Answers = {};
  for (const id of QUESTION_IDS) answers[id] = text(form, id);
  await db.profile.upsert({ where: { id: 1 }, update: { answers }, create: { id: 1, answers } });
  revalidatePath("/profile");
}

export async function uploadResume(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_RESUME_BYTES) throw new Error("Resume must be under 4 MB.");

  const data = {
    content: await resumeText(file),
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileData: Buffer.from(await file.arrayBuffer()),
  };
  const master = await db.resume.findFirst({ where: { isMaster: true } });
  if (master) await db.resume.update({ where: { id: master.id }, data });
  else await db.resume.create({ data: { label: "Master resume", isMaster: true, ...data } });
  revalidatePath("/profile");
}

export async function saveAnswer(form: FormData) {
  const id = Number(form.get("id")) || undefined;
  const data = { category: text(form, "category") || "General", question: text(form, "question"), answer: text(form, "answer") };
  if (!data.question) return;
  if (id) await db.answer.update({ where: { id }, data });
  else await db.answer.create({ data });
  revalidatePath("/profile");
}

export async function deleteAnswer(form: FormData) {
  await db.answer.delete({ where: { id: Number(form.get("id")) } });
  revalidatePath("/profile");
}
