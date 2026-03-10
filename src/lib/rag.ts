export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error('Vectors must be of the same length');
    }

    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

export function findTopMatches(
    queryEmbedding: number[],
    documentEmbeddings: number[][],
    chunks: string[],
    topK: number = 4
): { chunk: string; score: number }[] {
    const scoredChunks = documentEmbeddings.map((docEmb, index) => ({
        chunk: chunks[index],
        score: cosineSimilarity(queryEmbedding, docEmb),
    }));

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK);
}
