import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';
import { MouseShine } from '@/components/design-system/MouseShine';

export default function OnboardingPage() {
  return (
    <div className="bg-blueprint-grid bg-blueprint-grid-interactive relative flex min-h-screen items-center justify-center px-4 py-12">
      <MouseShine />
      <div className="w-full max-w-lg">
        <OnboardingWizard />
      </div>
    </div>
  );
}
