import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import MobileNav from '@/components/MobileNav';
import './globals.css';

// One clean grotesk across the whole app - the reference this follows uses
// a single typeface with weight doing all the hierarchy work, not a second
// display face or a monospace for numbers.
const inter = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'FlipOS - Find profitable flips before other people do',
  description: 'AI-powered flip analysis for resellers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas font-body text-ink antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pb-16">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
