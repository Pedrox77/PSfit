import AppShell from "@/components/app-shell";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export default async function BillingPage({
  searchParams,
}: BillingPageProps) {
  const t = await getTranslations("Billing");
  await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/settings/billing");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        plan,
        plan_status
      `,
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[PSFIT BILLING: profile]", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
  }

  const isPro =
    ["pro", "pro_mensal", "pro_anual"].includes(profile?.plan ?? "") &&
    ["active", "trialing"].includes(profile?.plan_status ?? "");

  const status = (() => {
    switch (profile?.plan_status) {
      case "active":
        return t("statuses.active");
      case "trialing":
        return t("statuses.trialing");
      case "past_due":
        return t("statuses.past_due");
      case "canceled":
        return t("statuses.canceled");
      case "unpaid":
        return t("statuses.unpaid");
      case "paused":
        return t("statuses.paused");
      case "incomplete":
        return t("statuses.incomplete");
      case "incomplete_expired":
        return t("statuses.incomplete_expired");
      default:
        return t("statuses.inactive");
    }
  })();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="eyebrow">{t("billingEyebrow")}</p>

          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            {t("billingTitle")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
            {t("pageDescription")}
          </p>
        </header>

        {profileError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {t("loadError")}
          </div>
        )}

        <section className="card p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted">{t("currentPlan")}</p>

              <h2 className="mt-2 text-2xl font-semibold">
                {isPro ? t("currentPlanPro") : t("freePlan")}
              </h2>

              <p className="mt-2 text-sm text-muted">
                {isPro
                  ? t("caktoManaged")
                  : t("freeUpsell")}
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                isPro
                  ? "border-acid/40 bg-acid/10 text-acid"
                  : "border-white/10 bg-white/[0.04] text-muted"
              }`}
            >
              {status}
            </span>
          </div>

          <dl className="mt-7 grid gap-5 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
            <Detail label={t("currentPlan")} value={isPro ? t("pro") : t("freePlan")} />
            <Detail label={t("status")} value={status} />
            <Detail label={t("provider")} value="Cakto" />
          </dl>

          <p className="mt-7 border-t border-white/[0.07] pt-6 text-sm text-muted">{t("managedByCakto")}</p>
          {isPro && process.env.NEXT_PUBLIC_CAKTO_SUPPORT_URL && <a href={process.env.NEXT_PUBLIC_CAKTO_SUPPORT_URL} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold">{t("billingSupport")}</a>}
        </section>

        {!isPro && (
          <section>
            <div className="mb-5">
              <p className="eyebrow">{t("upgradeEyebrow")}</p>

              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {t("chooseProTitle")}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <PlanCard
                title={t("monthlyPlan")}
                price={t("monthlyPrice")}
                description={t("monthlyDescription")}
              >
                <CheckoutButton billingCycle="monthly">
                  {t("subscribeMonthly")}
                </CheckoutButton>
              </PlanCard>

              <PlanCard
                title={t("yearlyPlan")}
                price={t("yearlyPrice")}
                description={t("yearlyEquivalent")}
                highlighted
                badge={t("bestValue")}
              >
                <CheckoutButton billingCycle="yearly">
                  {t("subscribeYearly")}
                </CheckoutButton>
              </PlanCard>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function PlanCard({
  title,
  price,
  description,
  badge,
  highlighted = false,
  children,
}: {
  title: string;
  price: string;
  description: string;
  badge?: string;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`relative rounded-3xl border p-6 ${
        highlighted
          ? "border-acid/50 bg-acid/[0.05] shadow-[0_0_60px_rgba(174,255,47,0.08)]"
          : "border-white/[0.09] bg-white/[0.025]"
      }`}
    >
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-acid px-3 py-1 text-xs font-bold text-ink">
          {badge}
        </span>
      )}

      <h3 className="pr-24 text-xl font-semibold">{title}</h3>

      <p className="mt-5 text-3xl font-bold">{price}</p>

      <p className="mt-3 min-h-12 text-sm text-muted">
        {description}
      </p>

      <ul className="my-6 space-y-2 text-sm text-muted">
        <li>✓ Complete nutrition tracking</li>
        <li>✓ Meal, macro and water targets</li>
        <li>✓ Load progression suggestions</li>
        <li>✓ PSFIT Twin</li>
        <li>✓ Advanced progress analytics</li>
      </ul>

      {children}
    </article>
  );
}
