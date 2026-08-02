import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Short by design (the user explicitly chose "short-lived static code" over
// an auto-refreshing one) - keeps the window a stray screenshot or photo of
// the QR code would still work in as small as possible.
const TOKEN_TTL_MS = 2 * 60 * 1000;

// Generates a single-use, short-lived token for the Filming Mode QR code's
// auto-login handoff. Only ever called from an already-authenticated
// Server Component for the signed-in user's own id - this function itself
// doesn't check identity, the caller already has.
export async function createQrLoginToken(userId: string, nextPath: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const admin = createAdminClient();
  const { error } = await admin.from('qr_login_tokens').insert({
    token,
    user_id: userId,
    next_path: nextPath,
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}
