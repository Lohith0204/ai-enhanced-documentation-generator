'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
    chunks: string[];
}

export default function DocumentationViewer({ chunks }: Props) {
    const [doc, setDoc] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await fetch('/api/generate-docs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chunks }),
                });
                if (!res.ok) throw new Error((await res.json()).error || 'Generation failed.');
                const data = await res.json();
                if (active) setDoc(data.documentation);
            } catch (err: any) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [chunks]);

    const downloadMd = () => {
        const blob = new Blob([doc], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: `doc_${Date.now()}.md` });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div style={{
            height: '580px',
            background: '#0f0f0f',
            border: '1px solid #1e1e1e',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
        }}>
            <div style={{
                width: '20px', height: '20px',
                border: '1.5px solid #222',
                borderTopColor: '#888',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#555', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>
                generating summary...
            </p>
            {/* Skeleton lines */}
            <div style={{ width: '260px', marginTop: '8px', opacity: 0.15 }}>
                {[100, 80, 90, 60, 75, 85].map((w, i) => (
                    <div key={i} style={{
                        height: '8px',
                        background: '#555',
                        borderRadius: '2px',
                        marginBottom: '8px',
                        width: `${w}%`,
                        animationDelay: `${i * 100}ms`,
                    }} />
                ))}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error) return (
        <div style={{
            height: '580px',
            background: '#0f0f0f',
            border: '1px solid #2a1414',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            padding: '24px',
            textAlign: 'center',
        }}>
            ⚠ {error}
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '580px',
            background: '#0f0f0f',
            border: '1px solid #1e1e1e',
            borderRadius: '6px',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#0c0c0c',
                borderBottom: '1px solid #1a1a1a',
                flexShrink: 0,
            }}>
                <span style={{ color: '#555', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Generated Summary
                </span>
                <button
                    onClick={downloadMd}
                    style={{
                        background: 'none',
                        border: '1px solid #222',
                        borderRadius: '3px',
                        color: '#555',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#444'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#222'; (e.currentTarget as HTMLButtonElement).style.color = '#555'; }}
                >
                    ↓ Export .md
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                <div className="prose-doc">
                    <ReactMarkdown>{doc}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
