"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// Approve a filled-in application, or retry one that needed you after you
// fixed the cause (e.g. answered a new question). The apply agent picks
// approved applications up on its next run and submits them.
export async function approveApplication(form: FormData) {
  const id = Number(form.get("id"));
  await db.application.update({ where: { id }, data: { status: "approved" } });
  await db.applicationLog.create({ data: { applicationId: id, message: "Approved by you; will submit on the next agent run" } });
  revalidatePath("/applications");
}

export async function skipApplication(form: FormData) {
  const id = Number(form.get("id"));
  const app = await db.application.update({ where: { id }, data: { status: "skipped" } });
  await db.job.update({ where: { id: app.jobId }, data: { status: "skipped" } });
  await db.applicationLog.create({ data: { applicationId: id, message: "Skipped by you" } });
  revalidatePath("/applications");
}
