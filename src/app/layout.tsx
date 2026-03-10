import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocEngine - AI Document Intelligence',
  description: 'Upload documents, generate structured summaries, and ask questions using AI.',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
