import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';

// Same optionality shape as this app's other env-gated features
// (CREATOMATE_API_KEY, MOCK_BILLING, etc.), but for authorization rather
// than a feature toggle: a comma-separated allowlist of the operator's own
// email(s), checked server-side. There's no staff/roles table in this app
// (one business row per customer), so a dedicated admin-flag column would
// mean adding a table just to hold a single operator's identity - an env
// var is the simpler, equally secure fit for "exactly one (or a couple of)
// trusted admin account(s)."
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

// Server Component / Route Handler helper, same shape as requireBusiness()
// in session.ts. Sends a non-admin back to their own dashboard rather than
// a 404/403 page - simplest honest response for a page that only ever has
// one intended visitor.
export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect('/dashboard');
  return user;
}
