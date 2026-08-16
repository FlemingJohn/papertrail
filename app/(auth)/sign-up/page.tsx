import { signUp } from "@/lib/auth/actions";
import { CredentialsForm } from "@/components/auth/credentials-form";

export const metadata = {
  title: "Create an account",
};

export default function SignUpPage() {
  return <CredentialsForm mode="sign-up" action={signUp} nextPath={null} />;
}
