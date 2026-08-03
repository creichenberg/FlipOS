'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Pre-auth pages, plus onboarding, are locked to light mode - matching the
// landing page rather than the normal dark-first experience, and there's no
// theme toggle yet to make a dark/light choice meaningful this early.
// Everything past onboarding (dashboard, settings, etc.) keeps the normal
// dark-first experience with the theme toggle.
const LIGHT_ONLY_PATHS = ['/', '/login', '/onboarding', '/privacy'];

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const forcedTheme = LIGHT_ONLY_PATHS.includes(pathname) ? 'light' : undefined;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme={forcedTheme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
