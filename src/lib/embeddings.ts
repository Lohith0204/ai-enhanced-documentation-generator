import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN || '');

export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
    if (!chunks || chunks.length === 0) return [];
    if (!process.env.HF_TOKEN) {
        throw new Error("Hugging Face Inference API token is missing. Ensure the HF_TOKEN environment variable is set.");
    }

    try {
        // Hugging Face featureExtraction can have limits on input count/size.
        // Batching ensures reliability for large documents.
        const batchSize = 16;
        let allEmbeddings: number[][] = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const response = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                inputs: batch,
            });

            // Ensure response is consistently treated as 2D array
            if (Array.isArray(response)) {
                if (Array.isArray(response[0])) {
                    allEmbeddings.push(...(response as number[][]));
                } else {
                    // Case where a single input returned a 1D array (e.g., batch size 1)
                    allEmbeddings.push(response as unknown as number[]);
                }
            }
        }

        return allEmbeddings;
    } catch (error: any) {
        console.error("Error generating embeddings:", error);
        throw new Error(`Failed to generate embeddings: ${error.message || 'Unknown error'} `);
    }
}

export async function generateSingleEmbedding(text: string): Promise<number[]> {
    const result = await generateEmbeddings([text]);
    return result[0];
}
