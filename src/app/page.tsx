'use client';

import { useState, useEffect } from 'react';
import UploadArea from '@/components/UploadArea';
import ChatInterface from '@/components/ChatInterface';
import DocumentationViewer from '@/components/DocumentationViewer';

type Tab = 'summary' | 'chat';

interface Session {
  chunks: string[];
  embeddings: number[][];
  fileName: string;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>('summary');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleUpload = (chunks: string[], embeddings: number[][], fileName: string) => {
    setSession({ chunks, embeddings, fileName });
    setTab('summary');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c0c0c', color: '#e8e8e8' }}>

      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
        borderBottom: '1px solid #1a1a1a',
        background: '#0c0c0c',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="DocEngine Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            fontWeight: 500,
            color: '#e8e8e8',
            letterSpacing: '-0.01em',
          }}>
            DocEngine
          </span>
        </div>

        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: '#444',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session.fileName}
            </span>
            <button
              onClick={() => setSession(null)}
              style={{
                background: 'none',
                border: '1px solid #222',
                borderRadius: '3px',
                color: '#555',
                padding: '3px 10px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
              }}
            >
              ✕ close
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        {!session ? (
          /* Upload state */
          <div>
            <div style={{ marginBottom: '48px' }}>
              <img src="/logo.png" alt="DocEngine Logo" style={{ width: '48px', height: '48px', marginBottom: '16px', borderRadius: '4px' }} />
              <h1 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: '#e8e8e8',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}>
                Document Intelligence
              </h1>
              <p style={{ color: '#555', fontSize: '14px', margin: 0, maxWidth: '400px', lineHeight: 1.6 }}>
                Upload a document to generate a structured summary and ask questions about its contents.
              </p>
            </div>

            <UploadArea onUploadSuccess={handleUpload} />

            {/* Capabilities grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              marginTop: '48px',
              background: '#1a1a1a',
              border: '1px solid #1a1a1a',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              {[
                { label: 'Summary', desc: 'Auto-generated executive brief from your document' },
                { label: 'Q&A', desc: 'Ask questions — answers are grounded in the source' },
                { label: 'Export', desc: 'Download the generated summary as a Markdown file' },
              ].map(item => (
                <div key={item.label} style={{ background: '#0f0f0f', padding: '20px', }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <p style={{ color: '#555', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Document workspace */
          <div>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginBottom: '20px',
              borderBottom: '1px solid #1a1a1a',
              paddingBottom: '0',
            }}>
              {(['summary', 'chat'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: tab === t ? '1px solid #e8e8e8' : '1px solid transparent',
                    color: tab === t ? '#e8e8e8' : '#555',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: tab === t ? 500 : 400,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    transition: 'color 0.15s',
                    marginBottom: '-1px',
                  }}
                >
                  {t === 'summary' ? 'Summary' : 'Chat'}
                </button>
              ))}
            </div>

            {tab === 'summary' && <DocumentationViewer chunks={session.chunks} />}
            {tab === 'chat' && <ChatInterface chunks={session.chunks} embeddings={session.embeddings} />}
          </div>
        )}
      </main>
    </div>
  );
}
