import { NicknameForm } from "@/components/onboarding/nickname-form";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
export const metadata={title:"Choose your nickname"};
export default function Page(){return <OnboardingShell step={1} total={4} title="Choose your PSFIT nickname" description="This is how people will find and recognize you in the community."><NicknameForm/></OnboardingShell>}
