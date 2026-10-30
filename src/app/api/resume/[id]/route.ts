import { db } from "@/lib/db";

// Download the original file of a stored resume.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await db.resume.findUnique({ where: { id: Number(id) } });
  if (!resume?.fileData) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(resume.fileData), {
    headers: {
      "Content-Type": resume.fileType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${resume.fileName ?? "resume"}"`,
    },
  });
}
