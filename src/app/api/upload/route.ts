export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { chunkText } from '@/lib/chunker';
import { generateEmbeddings } from '@/lib/embeddings';

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map((item: any) => ('str' in item ? item.str : ''))
            .join(' ')
            .trim();

        if (pageText) {
            pageTexts.push(pageText);
        }
    }

    return pageTexts.join('\n\n');
}

// Limit to 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 413 });
        }

        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF, DOCX, and TXT are allowed.' }, { status: 415 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = '';

        // Text Extraction
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            extractedText = await extractTextFromPdf(buffer);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            extractedText = buffer.toString('utf-8');
        }

        // Cleaning text
        extractedText = (extractedText || '').replace(/\s+/g, ' ').trim();

        if (!extractedText) {
            return NextResponse.json({ error: 'Failed to extract text from the document.' }, { status: 422 });
        }

        // Chunk text
        const chunks = chunkText(extractedText, 500, 100);

        // Generate Embeddings
        const embeddings = await generateEmbeddings(chunks);

        return NextResponse.json({
            message: 'Document processed successfully',
            chunks,
            embeddings,
            fileName: file.name,
        });
    } catch (error: any) {
        console.error('Error processing document:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
