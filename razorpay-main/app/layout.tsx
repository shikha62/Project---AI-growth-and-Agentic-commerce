import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Growth & Agentic Commerce',
  description: 'Autonomous commerce orchestration for merchant revenue growth and AI buyer discovery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
