"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  emptyAuthFormState,
  type AuthFormState,
} from "@/lib/auth/form-state";
import {
  buttonPrimary,
  displayMedium,
  microLabel,
  sectionLabel,
} from "@/lib/design/tokens";
import { CheckIcon, ProblemIcon } from "@/components/dashboard/icons";

interface CredentialsFormProps {
  mode: "sign-in" | "sign-up";
  action: (
    previous: AuthFormState,
    formData: FormData
  ) => Promise<AuthFormState>;
  nextPath: string | null;
}

const copy = {
  "sign-in": {
    eyebrow: "Sign in",
    heading: "Welcome back.",
    submit: "Sign in",
    busy: "Signing in",
    switchText: "No account yet?",
    switchLabel: "Create one",
    switchHref: "/sign-up",
    passwordHint: "The password you chose when you created the account",
  },
  "sign-up": {
    eyebrow: "Create an account",
    heading: "Start checking papers.",
    submit: "Create the account",
    busy: "Creating",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
    passwordHint: "At least eight characters",
  },
} as const;

export function CredentialsForm({
  mode,
  action,
  nextPath,
}: CredentialsFormProps) {
  const [state, submit] = useActionState(action, emptyAuthFormState);
  const words = copy[mode];

  return (
    <div className="mx-auto w-full max-w-md">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <p className={`${sectionLabel} mb-4`}>{words.eyebrow}</p>
        <h1 className={displayMedium}>{words.heading}</h1>
      </motion.header>

      <form action={submit} className="space-y-8">
        {nextPath === null ? null : (
          <input type="hidden" name="next" value={nextPath} />
        )}

        <div>
          <label htmlFor="email" className={`${microLabel} mb-3 block`}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full border-b border-white/20 bg-transparent pb-2 font-display text-lg font-light outline-none transition-colors focus:border-white/50"
          />
        </div>

        <div>
          <label htmlFor="password" className={`${microLabel} mb-3 block`}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            className="w-full border-b border-white/20 bg-transparent pb-2 font-display text-lg font-light outline-none transition-colors focus:border-white/50"
          />
          <p className={`${microLabel} mt-3`}>{words.passwordHint}</p>
        </div>

        {state.errorMessage === null ? null : (
          <div
            role="alert"
            className="flex gap-3 border border-verdict-retracted/40 px-5 py-4"
          >
            <ProblemIcon className="size-4 shrink-0 translate-y-0.5 text-verdict-retracted" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {state.errorMessage}
            </p>
          </div>
        )}

        {state.noticeMessage === null ? null : (
          <div className="flex gap-3 border border-verdict-supported/40 px-5 py-4">
            <CheckIcon className="size-4 shrink-0 translate-y-0.5 text-verdict-supported" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {state.noticeMessage}
            </p>
          </div>
        )}

        <div className="border-t border-white/10 pt-8">
          <SubmitButton label={words.submit} busyLabel={words.busy} />

          <p className={`${microLabel} mt-6`}>
            {words.switchText}{" "}
            <Link
              href={words.switchHref}
              className="text-foreground transition-colors hover:text-accent"
            >
              {words.switchLabel}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

function SubmitButton({
  label,
  busyLabel,
}: {
  label: string;
  busyLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground`}
    >
      {pending ? busyLabel : label}
    </button>
  );
}
