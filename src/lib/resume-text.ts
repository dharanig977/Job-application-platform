import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

// Pull plain text out of an uploaded resume so it can be scored and tailored.
export async function resumeText(file: File): Promise<string> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    return value.trim();
  }
  return new TextDecoder().decode(buffer).trim();
}
