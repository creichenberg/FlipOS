'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Pre-auth pages are locked to light mode - no dark/light choice to make
// before there's an account to save the preference against. Everything past
// sign-in (dashboard, settings, onboarding, etc.) keeps the normal
// dark-first experience with the theme toggle.
const LIGHT_ONLY_PATHS = ['/', '/login'];

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
