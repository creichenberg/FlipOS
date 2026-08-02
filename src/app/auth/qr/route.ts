import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Redemption endpoint for the Filming Mode QR code's auto-login handoff.
// Deliberately public (no auth required to hit it) - that's the point, a
// signed-out phone scanning the code lands here - but it can only ever
// succeed with a valid, unexpired, unused token, which is what actually
// gates it. Any failure degrades to the pre-auto-login behavior (send them
// to /login, optionally still pointed at the right destination) rather than
// a broken page, since this is an enhancement layered on a flow that
// already worked without it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.redirect(`${origin}/login`);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Atomic consume: the UPDATE's WHERE clause (unused + unexpired) is the
  // single source of truth for validity, so a race between two requests for
  // the same token can only ever let one of them through.
  const { data: consumed } = await admin
    .from('qr_login_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('user_id, next_path');

  const row = consumed?.[0];
  if (!row) return NextResponse.redirect(`${origin}/login`);

  // Same open-redirect guard as the `next` param elsewhere - defense in
  // depth even though this value only ever came from our own server.
  const destination = row.next_path.startsWith('/') && !row.next_path.startsWith('//') ? row.next_path : '/dashboard';
  const loginFallback = `${origin}/login?next=${encodeURIComponent(destination)}`;

  const { data: userData } = await admin.auth.admin.getUserById(row.user_id);
  const email = userData?.user?.email;
  // Phone-only accounts have no email to generate a magic link for - fall
  // back to a normal sign-in on the phone, same as before auto-login.
  if (!email) return NextResponse.redirect(loginFallback);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkError || !linkData?.properties?.hashed_token) return NextResponse.redirect(loginFallback);

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyError) return NextResponse.redirect(loginFallback);

  return NextResponse.redirect(`${origin}${destination}`);
}
