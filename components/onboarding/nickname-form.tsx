"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  CheckCircle2,
  CircleX,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { PsfitLoader } from "@/components/ui/psfit-loader";
import { ensureOnboardingProfile } from "@/app/onboarding/actions";

type AvailabilityStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

type NicknameFormProps = {
  initialUsername?: string | null;
  defaultValue?: string | null;

  // Mantém compatibilidade caso a página antiga ainda passe uma action.
  // A action não será mais usada por este formulário.
  action?: (formData: FormData) => void | Promise<void>;
};

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "support",
  "help",
  "psfit",
  "official",
  "settings",
  "login",
  "logout",
  "signup",
  "register",
  "api",
  "community",
  "dashboard",
  "explore",
  "activity",
  "notifications",
  "security",
  "privacy",
  "terms",
  "profile",
  "workouts",
  "nutrition",
]);

const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 30) {
    return "Use 3–30 lowercase letters, numbers, dots, or underscores.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Use 3–30 lowercase letters, numbers, dots, or underscores.";
  }

  if (username.startsWith(".") || username.endsWith(".")) {
    return "The nickname cannot start or end with a dot.";
  }

  if (username.includes("..")) {
    return "The nickname cannot contain consecutive dots.";
  }

  if (RESERVED_USERNAMES.has(username)) {
    return "This nickname is reserved.";
  }

  return null;
}

function getRpcErrorMessage(message: string): string {
  if (message.includes("USERNAME_TAKEN")) {
    return "This nickname is already taken.";
  }

  if (message.includes("USERNAME_RESERVED")) {
    return "This nickname is reserved.";
  }

  if (message.includes("USERNAME_INVALID")) {
    return "Use 3–30 lowercase letters, numbers, dots, or underscores.";
  }

  if (message.includes("AUTH_REQUIRED")) {
    return "Your session has expired. Please sign in again.";
  }

  if (message.includes("PROFILE_NOT_FOUND")) {
    return "Your profile could not be found. Please sign in again.";
  }

  return "We couldn't save your nickname. Please try again.";
}

export function NicknameForm({
  initialUsername,
  defaultValue,
}: NicknameFormProps) {
  const router = useRouter();

  // Cria apenas uma instância do cliente.
  const supabase = useMemo(() => createClient(), []);

  const startingValue = initialUsername ?? defaultValue ?? "";

  const [value, setValue] = useState(startingValue);
  const [status, setStatus] =
    useState<AvailabilityStatus>("idle");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Cada verificação recebe um número.
  // Respostas antigas são ignoradas.
  const requestIdRef = useRef(0);

  const normalizedUsername = normalizeUsername(value);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const validationError = normalizedUsername
      ? validateUsername(normalizedUsername)
      : null;

    if (!normalizedUsername) {
      setStatus("idle");
      setMessage("");

      return () => {
        if (requestIdRef.current === requestId) {
          requestIdRef.current += 1;
        }
      };
    }

    if (validationError) {
      setStatus("invalid");
      setMessage(validationError);

      return () => {
        if (requestIdRef.current === requestId) {
          requestIdRef.current += 1;
        }
      };
    }

    setStatus("checking");
    setMessage("Checking availability...");

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const { data, error } = await supabase.rpc(
            "check_username_availability",
            {
              candidate: normalizedUsername,
            },
          );

          // O usuário já digitou outra coisa.
          if (requestId !== requestIdRef.current) {
            return;
          }

          if (error) {
            console.error(
              "Nickname availability error:",
              error.message,
            );

            setStatus("error");
            setMessage(
              "We couldn't check this nickname. Please try again.",
            );
            return;
          }

          // A função retorna diretamente true ou false.
          if (data === true) {
            setStatus("available");
            setMessage("This nickname is available.");
            return;
          }

          setStatus("taken");
          setMessage(
            "This nickname is already taken or reserved.",
          );
        } catch (unknownError) {
          if (requestId !== requestIdRef.current) {
            return;
          }

          console.error(
            "Unexpected nickname availability error:",
            unknownError,
          );

          setStatus("error");
          setMessage(
            "We couldn't check this nickname. Please try again.",
          );
        }
      })();
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);

      // Invalida respostas de requisições anteriores.
      if (requestIdRef.current === requestId) {
        requestIdRef.current += 1;
      }
    };
  }, [normalizedUsername, supabase]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const candidate = normalizeUsername(value);
    const validationError = validateUsername(candidate);

    if (validationError) {
      setStatus("invalid");
      setMessage(validationError);
      return;
    }

    if (status !== "available") {
      setMessage(
        "Wait until the nickname availability is confirmed.",
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();
      if (authError || !auth.user) {
        setStatus("error");
        setMessage(
          "Your session has expired. Please sign in again.",
        );
        return;
      }

      const profileResult =
        await ensureOnboardingProfile();
      if (!profileResult.ok) {
        setStatus("error");
        setMessage(
          "We couldn't prepare your profile. Please try again.",
        );
        return;
      }

      // Verifica novamente no momento do envio.
      const {
        data: isAvailable,
        error: availabilityError,
      } = await supabase.rpc(
        "check_username_availability",
        {
          candidate,
        },
      );

      if (availabilityError) {
        console.error(
          "Final nickname check error:",
          availabilityError.message,
        );

        setStatus("error");
        setMessage(
          "We couldn't confirm this nickname. Please try again.",
        );
        return;
      }

      if (isAvailable !== true) {
        setStatus("taken");
        setMessage(
          "This nickname has just been taken. Choose another one.",
        );
        return;
      }

      const { error: saveError } = await supabase.rpc(
        "set_my_username",
        {
          candidate,
        },
      );

      if (saveError) {
        console.error(
          "Save nickname error:",
          saveError.message,
        );

        const friendlyMessage = getRpcErrorMessage(
          saveError.message,
        );

        if (saveError.message.includes("USERNAME_TAKEN")) {
          setStatus("taken");
        } else if (
          saveError.message.includes("USERNAME_INVALID") ||
          saveError.message.includes("USERNAME_RESERVED")
        ) {
          setStatus("invalid");
        } else {
          setStatus("error");
        }

        setMessage(friendlyMessage);
        return;
      }

      router.replace("/onboarding/personalization");
      router.refresh();
    } catch (unknownError) {
      console.error(
        "Unexpected save nickname error:",
        unknownError,
      );

      setStatus("error");
      setMessage(
        "We couldn't save your nickname. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const isButtonDisabled =
    status !== "available" || isSaving;

  const messageClassName =
    status === "available"
      ? "text-[#A8FF2A]"
      : status === "checking"
        ? "text-[#8D938F]"
        : "text-red-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      noValidate
    >
      <div className="space-y-3">
        <label
          htmlFor="nickname"
          className="block text-sm font-semibold text-white"
        >
          Nickname
        </label>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#8D938F]">
            <AtSign
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <input
            id="nickname"
            name="username"
            type="text"
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value
                .toLowerCase()
                .replace(/^@+/, "")
                .slice(0, 30);

              setValue(nextValue);
            }}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={30}
            placeholder="your.nickname"
            aria-describedby="nickname-message"
            aria-invalid={
              status === "invalid" ||
              status === "taken" ||
              status === "error"
            }
            className={[
              "h-16 w-full rounded-2xl border bg-[#070A08]",
              "pl-12 pr-14 text-base font-semibold text-white",
              "outline-none transition",
              "placeholder:text-[#626863]",
              status === "available"
                ? "border-[#A8FF2A] shadow-[0_0_0_1px_rgba(168,255,42,0.25)]"
                : status === "invalid" ||
                    status === "taken" ||
                    status === "error"
                  ? "border-red-500/70"
                  : "border-white/15 focus:border-[#A8FF2A]",
            ].join(" ")}
          />

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            {status === "checking" && (
              <Loader2
                className="h-5 w-5 animate-spin text-[#35D9F5]"
                aria-hidden="true"
              />
            )}

            {status === "available" && (
              <CheckCircle2
                className="h-5 w-5 text-[#A8FF2A]"
                aria-hidden="true"
              />
            )}

            {(status === "invalid" ||
              status === "taken" ||
              status === "error") && (
              <CircleX
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div
          id="nickname-message"
          aria-live="polite"
          className={`min-h-5 text-sm ${messageClassName}`}
        >
          {message}
        </div>
      </div>

      <button
        type="submit"
        disabled={isButtonDisabled}
        className={[
          "mt-7 flex h-14 w-full items-center justify-center",
          "rounded-full px-6 text-base font-bold transition",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#A8FF2A]",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-black",
          isButtonDisabled
            ? "cursor-not-allowed bg-[#395F0C] text-black/60"
            : "bg-[#A8FF2A] text-black hover:bg-[#B8FF50] active:scale-[0.99]",
        ].join(" ")}
      >
        {isSaving ? (
          <PsfitLoader size="sm" label=""/>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}

export default NicknameForm;
