'use client';

import { useCallback, useState } from 'react';

interface UploadAreaProps {
    onUploadSuccess: (chunks: string[], embeddings: number[][], fileName: string) => void;
}

export default function UploadArea({ onUploadSuccess }: UploadAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File) => {
        setError(null);
        setIsUploading(true);

        if (file.size > 10 * 1024 * 1024) {
            setError('File exceeds 10MB limit.');
            setIsUploading(false);
            return;
        }

        const validExts = ['.pdf', '.docx', '.txt'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validExts.includes(ext)) {
            setError('Only PDF, DOCX, and TXT files are supported.');
            setIsUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error || 'Upload failed.');
            }
            const data = await res.json();
            onUploadSuccess(data.chunks, data.embeddings, data.fileName);
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
    }, []);

    return (
        <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                    border: `1px solid ${isDragging ? '#555' : '#222'}`,
                    background: isDragging ? '#131313' : '#0f0f0f',
                    borderRadius: '6px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    cursor: 'default',
                }}
            >
                {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '24px', height: '24px',
                            border: '2px solid #333',
                            borderTopColor: '#e8e8e8',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <p style={{ color: '#737373', fontSize: '13px', margin: 0 }}>Processing document...</p>
                    </div>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p style={{ color: '#e8e8e8', fontSize: '14px', fontWeight: 500, margin: '0 0 6px' }}>
                            Drop your document here
                        </p>
                        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 24px', fontFamily: 'JetBrains Mono, monospace' }}>
                            PDF · DOCX · TXT · max 10 MB
                        </p>
                        <label style={{
                            display: 'inline-block',
                            background: '#e8e8e8',
                            color: '#0c0c0c',
                            padding: '7px 18px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}>
                            Browse files
                            <input
                                type="file"
                                style={{ display: 'none' }}
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                            />
                        </label>
                    </>
                )}
            </div>

            {error && (
                <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#140e0e',
                    border: '1px solid #2a1414',
                    borderRadius: '4px',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                }}>
                    ⚠ {error}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
