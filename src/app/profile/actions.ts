"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function saveProfile(form: FormData) {
  const data = {
    fullName: text(form, "fullName"),
    email: text(form, "email"),
    phone: text(form, "phone"),
    location: text(form, "location"),
    linkedinUrl: text(form, "linkedinUrl"),
    targetRoles: text(form, "targetRoles"),
    targetLocations: text(form, "targetLocations"),
    seniority: text(form, "seniority"),
  };
  await db.profile.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidatePath("/profile");
}

export async function saveMasterResume(form: FormData) {
  const file = form.get("file");
  let content = text(form, "content");
  // Plain-text uploads replace the pasted text; PDF/DOCX parsing comes with step 3.
  if (file instanceof File && file.size > 0) content = (await file.text()).trim();

  const master = await db.resume.findFirst({ where: { isMaster: true } });
  if (master) {
    await db.resume.update({ where: { id: master.id }, data: { content } });
  } else {
    await db.resume.create({ data: { label: "Master resume", isMaster: true, content } });
  }
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
