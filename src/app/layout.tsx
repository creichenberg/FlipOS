import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Nav from '@/components/Nav';
import './globals.css';

// One neutral, high-quality UI typeface for both display and body - the
// contrast comes from weight and tracking, not a second quirky display font.
const display = Inter({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '600'] });

export const metadata: Metadata = {
  title: 'FlipOS - Find profitable flips before other people do',
  description: 'AI-powered flip analysis for resellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ink font-body text-paper antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
