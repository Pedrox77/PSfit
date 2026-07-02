import { GeneratingPlan } from "@/components/onboarding/generating-plan";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { getLocale } from "next-intl/server";
export const metadata={title:"Generating your plan"};
const copy={en:{title:"Preparing your starting point",description:"PSFIT is creating your initial setup based on the answers you reviewed."},pt:{title:"Preparando seu ponto de partida",description:"O PSFIT está criando sua configuração inicial com base nas respostas que você revisou."},es:{title:"Preparando tu punto de partida",description:"PSFIT está creando tu configuración inicial según las respuestas que revisaste."}};
export default async function Page(){const locale=await getLocale() as keyof typeof copy;const text=copy[locale]??copy.en;return <OnboardingShell step={5} total={5} locale={locale==="pt"?"pt":"en"} title={text.title} description={text.description}><GeneratingPlan/></OnboardingShell>}
