import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const signedOutOnlyPaths = ["/sign-in", "/sign-up"];

const publicPaths = ["/", "/auth", "/api/health"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url === undefined || key === undefined) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [headerName, headerValue] of Object.entries(headers)) {
          response.headers.set(headerName, headerValue);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isSignedIn = data !== null;
  const path = request.nextUrl.pathname;

  if (isSignedIn && signedOutOnlyPaths.some((entry) => path.startsWith(entry))) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/knowledge";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  const isPublic = publicPaths.some(
    (entry) => path === entry || path.startsWith(`${entry}/`)
  );

  const isSignedOutOnly = signedOutOnlyPaths.some((entry) =>
    path.startsWith(entry)
  );

  if (!isSignedIn && !isPublic && !isSignedOutOnly) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sign in to use this. Your session has ended." },
        { status: 401 }
      );
    }

    const destination = request.nextUrl.clone();
    destination.pathname = "/sign-in";
    destination.search = `?next=${encodeURIComponent(`${path}${request.nextUrl.search}`)}`;
    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
