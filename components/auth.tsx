"use client";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations/signup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "next-intl";
import { Logo } from "./ui";
import { PsfitLoader } from "./ui/psfit-loader";

export default function Auth({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const isPortuguese = useLocale() === "pt";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = createClient();
    if (signup) {
      const parsed = signupSchema.safeParse({
        fullName: String(form.get("full_name")),
        email,
        password,
        confirmPassword: String(form.get("confirm_password")),
        terms: form.get("terms") === "on",
        privacy: form.get("privacy") === "on",
      });
      if (!parsed.success) {
        setPending(false);
        return setError(
          parsed.error.issues[0]?.message ?? (isPortuguese ? "Confira seus dados." : "Check your details."),
        );
      }
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { data, error: authError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: { full_name: parsed.data.fullName },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });
      setPending(false);
      if (authError) return setError(authError.message);
      router.push(
        data.session
          ? "/onboarding/nickname"
          : `/signup/check-email?email=${encodeURIComponent(email)}`,
      );
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (authError) return setError(authError.message);
    const redirectTo = new URLSearchParams(window.location.search).get(
      "redirectTo",
    );
    router.push(redirectTo?.startsWith("/") ? redirectTo : "/dashboard");
    router.refresh();
  }
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-6 sm:p-6">
        <div className="w-full min-w-0 max-w-md">
          <Logo />
          <h1 className="mt-10 text-3xl font-semibold sm:mt-12 sm:text-4xl">
            {signup ? (isPortuguese ? "Crie sua conta PSFIT" : "Create your PSFIT account") : (isPortuguese ? "Boas-vindas de volta." : "Welcome back.")}
          </h1>
          <p className="mt-3 text-muted">
            {signup
              ? (isPortuguese ? "Comece pela sua conta. Seu apelido vem em seguida." : "Start with your account. Your nickname comes next.")
              : (isPortuguese ? "Continue de onde parou." : "Continue from your next useful action.")}
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {signup && (
              <Field
                name="full_name"
                label={isPortuguese ? "Nome completo" : "Full name"}
                placeholder={isPortuguese ? "Seu nome completo" : "Your full name"}
                minLength={3}
                maxLength={100}
              />
            )}
            <Field
              name="email"
              type="email"
              label="Email"
              placeholder={isPortuguese ? "voce@exemplo.com" : "you@example.com"}
            />
            <Field
              name="password"
              type="password"
              label={isPortuguese ? "Senha" : "Password"}
              placeholder={isPortuguese ? "Pelo menos 8 caracteres" : "At least 8 characters"}
              minLength={8}
            />
            {signup && (
              <>
                <Field
                  name="confirm_password"
                  type="password"
                  label={isPortuguese ? "Confirmar senha" : "Confirm password"}
                  placeholder={isPortuguese ? "Digite sua senha novamente" : "Enter your password again"}
                  minLength={8}
                />
                <Consent name="terms">
                  {isPortuguese ? "Aceito os " : "I accept the "}
                  <Link className="text-paper underline" href="/terms">
                    {isPortuguese ? "Termos de Uso" : "Terms of Use"}
                  </Link>
                  .
                </Consent>
                <Consent name="privacy">
                  {isPortuguese ? "Aceito a " : "I accept the "}
                  <Link className="text-paper underline" href="/privacy">
                    {isPortuguese ? "Política de Privacidade" : "Privacy Policy"}
                  </Link>
                  .
                </Consent>
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              disabled={pending}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-acid py-3 font-bold text-ink disabled:opacity-60"
            >
              {pending ? (
                <PsfitLoader size="sm" label="" />
              ) : signup ? (
                isPortuguese ? "Criar conta" : "Create account"
              ) : (
                isPortuguese ? "Entrar" : "Sign in"
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {signup ? (isPortuguese ? "Já possui uma conta?" : "Already have an account?") : (isPortuguese ? "Ainda não usa o PSFIT?" : "New to PSFIT?")}{" "}
            <Link
              className="text-paper underline"
              href={signup ? "/login" : "/signup"}
            >
              {signup ? (isPortuguese ? "Entrar" : "Sign in") : (isPortuguese ? "Criar conta" : "Create account")}
            </Link>
          </p>
        </div>
      </section>
      <section className="hidden items-end bg-raised p-12 lg:flex">
        <div>
          <p className="eyebrow">{isPortuguese ? "Fitness para a vida real" : "Fitness for real life"}</p>
          <blockquote className="mt-5 max-w-xl text-4xl font-semibold leading-tight">
            {isPortuguese ? "“Um plano deve saber mudar sem perder seu propósito.”" : "“A plan should know how to change without losing its purpose.”"}
          </blockquote>
          <p className="mt-6 text-muted">
            {isPortuguese ? "O PSFIT adapta o dia sem perder a direção." : "PSFIT adapts the day while protecting the direction."}
          </p>
        </div>
      </section>
    </main>
  );
}
function Field({
  name,
  label,
  placeholder,
  type = "text",
  minLength = 1,
  maxLength,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        required
        minLength={minLength}
        maxLength={maxLength}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 placeholder:text-muted/60"
      />
    </label>
  );
}
function Consent({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-muted">
      <input
        required
        name={name}
        type="checkbox"
        className="mt-1 accent-[#a8ff2a]"
      />
      <span>{children}</span>
    </label>
  );
}
