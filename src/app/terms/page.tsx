import Link from 'next/link';
import { InteractiveLogo } from '@/components/design-system/InteractiveLogo';
import { PLAN_TIERS } from '@/lib/plans';

export const metadata = {
  title: 'Terms of Service',
};

export default function TermsOfServicePage() {
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-secondary">Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-base font-semibold text-foreground">Agreement</h2>
            <p className="mt-2">
              These terms govern your use of Blueprint Studio. By creating an account, you agree to them. They&apos;re
              written to match what the app actually does, not boilerplate - if something here changes, we&apos;ll
              update this page. See our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              for how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">The service</h2>
            <p className="mt-2">
              Blueprint Studio generates a weekly batch of personalized short-form video ideas for your business,
              helps you turn any of them into a shot list, script, and captions, guides you through filming it, and
              can automatically edit your uploaded clips into a finished video with captions burned in. Generated
              ideas and scripts are produced by AI and are starting points - review them before filming or posting,
              the same way you&apos;d review any content before it goes out under your business&apos;s name.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Subscriptions and billing</h2>
            <p className="mt-2">
              Blueprint Studio is offered on two paid subscription tiers, billed monthly through Stripe: Base (
              {PLAN_TIERS.base.videosPerWeek} video ideas/week) at ${PLAN_TIERS.base.price}/mo, and Pro (
              {PLAN_TIERS.pro.videosPerWeek} video ideas/week) at ${PLAN_TIERS.pro.price}/mo. You can cancel anytime
              from the billing page - cancellation takes effect at the end of your current billing period, and we
              don&apos;t offer prorated refunds for partial periods. We never see or store your card number; Stripe
              handles payment details directly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your content</h2>
            <p className="mt-2">
              You own the video and audio clips you upload or record while filming, and the finished videos we
              generate from them. You grant us a limited license to store that content and send it to our video
              rendering provider solely to assemble it into your finished, edited video - we don&apos;t use it for
              any other purpose, and we don&apos;t use your business information to generate content for anyone
              else. You&apos;re responsible for having the rights to appear in and publish whatever you upload.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
            <p className="mt-2">
              Blueprint Studio is meant for legitimate small-business marketing content. Don&apos;t use it to upload
              or generate content that&apos;s illegal, infringes someone else&apos;s rights, or is intended to
              deceive, harass, or harm others. We may suspend or terminate an account that violates this, and may
              review reports of misuse - if you see something that shouldn&apos;t be on the platform, contact us
              using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Account termination</h2>
            <p className="mt-2">
              You can stop using Blueprint Studio and delete your account at any time by contacting us - see our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              for what deletion removes. We may suspend or terminate accounts that violate these terms, including
              the acceptable use section above.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">No warranty, limited liability</h2>
            <p className="mt-2">
              Blueprint Studio is provided &quot;as is.&quot; AI-generated ideas, scripts, and auto-edited videos may
              contain mistakes - you&apos;re responsible for reviewing content before you post it. To the extent
              permitted by law, we&apos;re not liable for indirect or consequential damages arising from your use of
              the service, and our total liability is limited to the amount you paid us in the past three months.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Changes to these terms</h2>
            <p className="mt-2">
              We may update these terms as the product changes. If we make a material change, we&apos;ll update the
              &quot;Last updated&quot; date above. Continuing to use Blueprint Studio after a change means you accept
              the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Questions</h2>
            <p className="mt-2">
              If you have questions about these terms, reach out to the email associated with your Blueprint Studio
              account invitation.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
