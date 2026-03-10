import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || '',
    baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { chunks } = body;

        // We only need the text chunks to summarize, not the embeddings
        if (!chunks || chunks.length === 0) {
            return NextResponse.json({ error: 'Document context is missing' }, { status: 400 });
        }

        // Combine chunks up to a reasonable limit (~100k tokens for GPT-4o-mini, but let's take up to 20k to be safe and fast)
        // 1 chunk = ~500 chars (depends on the chunker), let's say 200 chunks max.
        const maxChunks = 200;
        const documentText = chunks.slice(0, maxChunks).join('\n\n');

        const prompt = `
You are an expert technical documentation generator.
Convert the following document into structured documentation.

Return sections formatted cleanly in Markdown:
1. Overview (A high-level executive summary)
2. Key Concepts (Bullet points of main ideas)
3. Important Rules (Any strict policies or guidelines)
4. Action Items (What users need to do or know practically)
5. Summary

Document:
${documentText}
`;

        const response = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an AI assistant specialized in creating structured documentation.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.2, // Low temperature for factual structuring
        });

        const structuredDoc = response.choices[0]?.message?.content || "Failed to generate documentation.";

        return NextResponse.json({ documentation: structuredDoc });

    } catch (error: any) {
        console.error('Error generating documentation:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
