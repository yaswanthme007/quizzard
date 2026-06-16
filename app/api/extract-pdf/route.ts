import { PDFParse } from "pdf-parse";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const entry = formData.get("file");

  if (!entry || !(entry instanceof Blob)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (entry.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 20 MB limit." }, { status: 413 });
  }

  const arrayBuffer = await entry.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const parser = new PDFParse({ data: buffer });
  let text: string;
  try {
    const result = await parser.getText();
    text = result.text ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF parsing failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  } finally {
    await parser.destroy();
  }

  return NextResponse.json({ text, charCount: text.length });
}
