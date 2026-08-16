import { signIn } from "@/lib/auth/actions";
import { CredentialsForm } from "@/components/auth/credentials-form";

export const metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <CredentialsForm
      mode="sign-in"
      action={signIn}
      nextPath={next !== undefined && next.startsWith("/") ? next : null}
    />
  );
}
