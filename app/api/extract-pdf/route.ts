import { extractText, getDocumentProxy } from 'unpdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return Response.json({ error: 'File too large (max 20MB)' }, { status: 413 });

    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });

    return Response.json({ text, charCount: text.length });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return Response.json({ error: 'Failed to extract PDF text' }, { status: 500 });
  }
}
