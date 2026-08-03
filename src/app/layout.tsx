import type { Metadata, Viewport } from 'next';
import { Archivo, Archivo_Black, Geist_Mono, Work_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import './globals.css';

// Body copy: Work Sans. Headings (h1-h6, see globals.css's base-layer rule):
// Archivo. The landing page's hero headline specifically uses Archivo Black
// (--font-display, applied via the `font-display` utility) for one heavier,
// more declarative moment - Archivo Black is a single-weight display face,
// too heavy to use for every heading without the app reading over-shouty.
const workSans = Work_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
});

const archivoBlack = Archivo_Black({
  variable: '--font-archivo-black',
  weight: '400',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const DESCRIPTION = 'Your AI social media manager - a weekly content plan, a shot list, and a guided shoot.';

export const metadata: Metadata = {
  title: {
    default: 'Blueprint Studio',
    template: '%s · Blueprint Studio',
  },
  description: DESCRIPTION,
  openGraph: {
    title: 'Blueprint Studio',
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Blueprint Studio',
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${workSans.variable} ${archivo.variable} ${archivoBlack.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas text-foreground">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
