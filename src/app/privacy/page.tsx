import Link from 'next/link';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <InteractiveLogo className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold tracking-tight">Blueprint Studio</span>
          </Link>
          <Link href="/login" className="text-sm text-text-secondary hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.15em] text-primary">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-secondary">Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-base font-semibold text-foreground">What this covers</h2>
            <p className="mt-2">
              This policy describes what Blueprint Studio collects when you create an account and use the
              product, and how that information is used. It&apos;s written to match what the app actually
              does, not boilerplate - if something here changes, we&apos;ll update this page.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-foreground">Account info</span> - your name, email
                address, and password (or your Google account, if you sign in that way), used to
                create and secure your account.
              </li>
              <li>
                <span className="font-medium text-foreground">Business profile</span> - the details you
                provide during onboarding (business name, industry, description, products or services,
                target audience, location, brand personality, and goals), used to personalize the video
                ideas and scripts we generate for you.
              </li>
              <li>
                <span className="font-medium text-foreground">Uploaded clips</span> - any video or audio you
                record or upload while filming, stored so it can be assembled into a finished, edited video.
              </li>
              <li>
                <span className="font-medium text-foreground">Billing info</span> - your subscription plan
                and status. Payment card details are handled entirely by Stripe - we never see or store your
                card number.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">How we use it</h2>
            <p className="mt-2">
              Your business profile is sent to Anthropic&apos;s Claude API to generate weekly video ideas,
              scripts, shot lists, and captions personalized to your business. Uploaded clips are stored
              privately and, when you start an auto-edit, sent to our video rendering provider to be cut
              together into a finished video with captions. We don&apos;t sell your data, and we don&apos;t
              use your business information to generate content for anyone else.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Who we share it with</h2>
            <p className="mt-2">
              We use a small number of service providers to run Blueprint Studio, each only for the purpose
              described above: Supabase (accounts and data storage), Anthropic (content generation), Stripe
              (billing), and a video rendering provider (auto-editing). None of them are permitted to use
              your data for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your data, your control</h2>
            <p className="mt-2">
              You can request a copy of your data or ask us to delete your account and everything associated
              with it at any time by contacting us. Deleting your account removes your business profile,
              generated content, and uploaded clips.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Questions</h2>
            <p className="mt-2">
              If you have questions about this policy or how your data is handled, reach out to the email
              associated with your Blueprint Studio account invitation.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
