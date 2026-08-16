import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function readAuthSettings(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url === undefined || key === undefined) {
    return null;
  }

  return { url, key };
}

export async function createSupabaseServerClient() {
  const settings = readAuthSettings();

  if (settings === null) {
    throw new Error(
      "Signing in is not set up. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(settings.url, settings.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });
}

export async function readSignedInAccount(): Promise<{
  accountId: string;
  email: string;
} | null> {
  if (readAuthSettings() === null) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error !== null || data === null) {
    return null;
  }

  return {
    accountId: data.claims.sub,
    email: data.claims.email ?? "",
  };
}
