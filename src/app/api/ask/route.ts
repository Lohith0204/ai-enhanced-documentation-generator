import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { generateSingleEmbedding } from '@/lib/embeddings';
import { findTopMatches } from '@/lib/rag';

const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || '',
    baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, chunks, embeddings } = body;

        if (!question) {
            return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400 });
        }

        if (!chunks || !embeddings || chunks.length === 0 || embeddings.length === 0) {
            return new Response(JSON.stringify({ error: 'Document context is missing' }), { status: 400 });
        }

        // 1. Generate embedding for the question
        const queryEmbedding = await generateSingleEmbedding(question);

        // 2. Find the top matching chunks
        const matches = findTopMatches(queryEmbedding, embeddings, chunks, 3);
        const contextText = matches.map(m => m.chunk).join('\n\n---\n\n');

        // 3. Construct prompt
        const prompt = `
You are a helpful and precise assistant. Answer the user's question ONLY using the provided context.

Context:
${contextText}

Question:
${question}

If the answer is not present in the context, say:
"The document does not contain this information." Do not hallucinate or make up answers.
`;

        // 4. Stream the Groq response
        const response = await groqClient.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            stream: true,
            messages: [
                { role: 'system', content: 'You are an AI assistant specialized in analyzing documents.' },
                { role: 'user', content: prompt }
            ],
        });

        const stream = new ReadableStream({
            async start(controller) {
                // We first send a custom event or header with the source data if needed, 
                // but Since Server-Sent Events are plain text, we can append a custom JSON block at the end,
                // or just stream the text and return sources separately.
                // For simplicity, we just stream the markdown text, and append a custom delimiter for the source at the end.

                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }

                // Append source attribution at the very end uniquely separated
                const sourcesJson = JSON.stringify({ type: '__SOURCES__', data: matches });
                controller.enqueue(new TextEncoder().encode(`\n\n__SOURCE_BLOCK__${sourcesJson}`));
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Error in QA chat:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
