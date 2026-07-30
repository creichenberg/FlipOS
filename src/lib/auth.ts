import { db } from './db';

/**
 * Phase 1 auth strategy: a single demo account, created on first run by
 * prisma/seed.ts. This lets the AI-analysis loop (the actual product bet)
 * ship and get real usage before investing in a full auth system.
 *
 * To swap in real multi-user auth later:
 *   1. npm install next-auth
 *   2. Add src/app/api/auth/[...nextauth]/route.ts with a Credentials or
 *      OAuth provider - the User model already has the fields it needs.
 *   3. Replace getCurrentUser() below with a call to `auth()` / `getServerSession()`.
 * Nothing else in the app needs to change - every API route already reads
 * the current user through this one function.
 */
export async function getCurrentUser() {
  const demoEmail = 'demo@flipos.app';
  const user = await db.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, name: 'Demo Flipper' },
  });
  return user;
}
