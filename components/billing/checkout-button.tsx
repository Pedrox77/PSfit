"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type BillingCycle = "monthly" | "yearly";
export function CheckoutButton({
  billingCycle,
  children,
}: {
  billingCycle: BillingCycle;
  children: React.ReactNode;
}) {
  const t = useTranslations("Billing");
  const [pending, setPending] = useState(false);

  function checkout() {
    if (pending) return;
    setPending(true);
    const url =
      billingCycle === "monthly"
        ? process.env.NEXT_PUBLIC_CAKTO_MONTHLY_CHECKOUT_URL
        : process.env.NEXT_PUBLIC_CAKTO_YEARLY_CHECKOUT_URL;
    if (!url) {
      setPending(false);
      return;
    }
    window.location.assign(url);
  }

  return (
    <div>
      <p className="mb-3 text-sm leading-6 text-muted">{t("useSameEmail")}</p>
      <button
        type="button"
        disabled={pending}
        onClick={checkout}
        className="w-full rounded-full bg-acid px-5 py-3 font-bold text-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid disabled:opacity-50"
      >
        {pending ? t("redirecting") : children}
      </button>
    </div>
  );
}
