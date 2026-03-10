export function chunkText(text: string, size: number = 500, overlap: number = 100): string[] {
    if (!text) return [];
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
        const end = Math.min(start + size, words.length);
        const chunk = words.slice(start, end).join(' ');
        chunks.push(chunk);

        // Move forward by size - overlap
        start += size - overlap;
    }

    return chunks;
}
