import { PricingSection } from "@/components/billing/pricing-section";
import { getTranslations } from "next-intl/server";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; feature?: string; plan?: string }>;
}) {
  const t = await getTranslations("Billing");
  const { checkout, feature, plan } = await searchParams;
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
      <header className="text-center">
        <p className="eyebrow">{t("pricingEyebrow")}</p>
        <h1 className="mt-3 text-4xl font-semibold">{t("pricingTitle")}</h1>
        {feature === "nutrition" && (
          <p className="mx-auto mt-4 max-w-xl rounded-xl border border-acid/20 bg-acid/[.05] p-3 text-sm text-acid">
            {t("nutritionFeatureNotice")}
          </p>
        )}
        {checkout === "canceled" && (
          <p className="mt-4 text-sm text-muted">{t("checkoutCanceled")}</p>
        )}
      </header>
      <PricingSection
        showHeading={false}
        initialCycle={plan === "yearly" ? "yearly" : "monthly"}
      />
    </main>
  );
}
