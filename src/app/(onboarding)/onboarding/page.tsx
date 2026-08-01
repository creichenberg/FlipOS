import { OnboardingWizard } from '@/components/features/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  return (
    <div className="bg-blueprint-grid flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <OnboardingWizard />
      </div>
    </div>
  );
}
