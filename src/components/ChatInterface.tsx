'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: { chunk: string; score: number }[];
}

interface Props {
    chunks: string[];
    embeddings: number[][];
}

export default function ChatInterface({ chunks, embeddings }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', role: 'assistant', content: 'Ready. Ask me anything about this document.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [expandedSource, setExpandedSource] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const question = input.trim();
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const asstId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: asstId, role: 'assistant', content: '' }]);

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, chunks, embeddings }),
            });

            if (!res.body) throw new Error('No stream');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let text = '';
            let sources: Message['sources'] = undefined;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                if (chunk.includes('__SOURCE_BLOCK__')) {
                    const [textPart, srcPart] = chunk.split('__SOURCE_BLOCK__');
                    text += textPart;
                    try { sources = JSON.parse(srcPart).data; } catch { }
                } else {
                    text += chunk;
                }
                setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: text, sources } : m));
            }
        } catch {
            setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: 'Failed to get a response. Please try again.' } : m));
        } finally {
            setLoading(false);
        }
    };

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
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '24px' }}>
                        {/* Label */}
                        <div style={{
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: '#555',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                        }}>
                            {msg.role === 'user' ? 'You' : 'DocEngine'}
                        </div>

                        {/* Content */}
                        <div style={{ color: msg.role === 'user' ? '#e8e8e8' : '#b4b4b4', fontSize: '14px', lineHeight: '1.65' }}>
                            {msg.role === 'user' ? (
                                <span>{msg.content}</span>
                            ) : (
                                <div className="chat-prose">
                                    <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Source */}
                        {msg.sources && msg.sources.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={() => setExpandedSource(expandedSource === msg.id ? null : msg.id)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #1e1e1e',
                                        borderRadius: '3px',
                                        color: '#555',
                                        fontSize: '11px',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        padding: '3px 8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                    }}
                                >
                                    <span style={{ color: '#333' }}>⌗</span>
                                    {expandedSource === msg.id ? 'Hide source' : 'View source'}
                                </button>

                                {expandedSource === msg.id && (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '12px',
                                        background: '#0c0c0c',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '4px',
                                        color: '#555',
                                        fontSize: '12px',
                                        fontFamily: 'JetBrains Mono, monospace',
                                        lineHeight: '1.6',
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                        borderLeft: '2px solid #222',
                                        paddingLeft: '12px',
                                    }}>
                                        {msg.sources[0].chunk}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DocEngine</div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '20px' }}>
                            {[0, 150, 300].map(delay => (
                                <div key={delay} style={{
                                    width: '4px', height: '4px', background: '#444', borderRadius: '50%',
                                    animation: `pulse 1s ease-in-out ${delay}ms infinite`,
                                }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#1a1a1a' }} />

            {/* Input */}
            <form onSubmit={sendMessage} style={{ display: 'flex', padding: '12px 16px', gap: '8px', background: '#0c0c0c' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={loading}
                    style={{
                        flex: 1,
                        background: '#111',
                        border: '1px solid #222',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        color: '#e8e8e8',
                        fontSize: '13px',
                        fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                        transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#444'}
                    onBlur={e => e.target.style.borderColor = '#222'}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                        background: '#e8e8e8',
                        color: '#0c0c0c',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                        opacity: input.trim() && !loading ? 1 : 0.4,
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Send
                </button>
            </form>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
        </div>
    );
}
