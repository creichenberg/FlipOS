import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/types/database';

const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/qr', '/', '/pricing'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

// Runs on every request. Refreshes the session cookie (required for
// server-side auth to keep working) and gates routes by onboarding/billing
// state so pages themselves don't need to duplicate this logic.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // API routes authenticate and authorize themselves (each does its own
  // supabase.auth.getUser() check and returns a proper 401/404 JSON body) -
  // they must never be subject to the page-redirect logic below. Without
  // this, POSTing to /api/onboarding/business while a business row doesn't
  // exist yet gets redirected to the /onboarding *page* (a fetch() client
  // expecting JSON gets an HTML/405 response instead), which is exactly the
  // request that's supposed to create that row in the first place.
  if (pathname.startsWith('/api/')) {
    return response;
  }

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    // Preserve the originally-requested page (e.g. a QR code deep-linking to
    // Filming Mode) so login can send the user back there instead of always
    // landing on the dashboard.
    const next = `${pathname}${url.search}`;
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }

  if (user && pathname !== '/onboarding' && !isPublicPath(pathname)) {
    const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).maybeSingle();

    if (!business) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  if (user && pathname === '/onboarding') {
    const { data: business } = await supabase.from('businesses').select('id').eq('user_id', user.id).maybeSingle();
    if (business) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
