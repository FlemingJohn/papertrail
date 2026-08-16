"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { credentialsSchema } from "../schemas/account";
import type { AuthFormState } from "./form-state";
import { createSupabaseServerClient } from "./server-client";

export async function signIn(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errorMessage:
        parsed.error.issues[0]?.message ??
        "Enter your email address and password.",
      noticeMessage: null,
    };
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "Signing in is not set up on this deployment.",
      noticeMessage: null,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error !== null) {
    return {
      errorMessage:
        error.code === "invalid_credentials"
          ? "That email and password do not match an account."
          : error.message,
      noticeMessage: null,
    };
  }

  const requested = formData.get("next");
  const destination =
    typeof requested === "string" && requested.startsWith("/")
      ? requested
      : "/knowledge";

  revalidatePath("/", "layout");
  redirect(destination);
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      errorMessage:
        parsed.error.issues[0]?.message ??
        "Enter an email address and a password of at least eight characters.",
      noticeMessage: null,
    };
  }

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : "Creating an account is not set up on this deployment.",
      noticeMessage: null,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error !== null) {
    return {
      errorMessage:
        error.code === "user_already_exists"
          ? "An account already uses that email address. Sign in instead."
          : error.message,
      noticeMessage: null,
    };
  }

  if (data.session === null) {
    return {
      errorMessage: null,
      noticeMessage:
        "Check your email and open the confirmation link, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/knowledge");
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    redirect("/sign-in");
  }

  revalidatePath("/", "layout");
  redirect("/sign-in");
}
