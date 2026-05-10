import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: "low" | "medium" | "high";
    sameSite?: boolean | "lax" | "none" | "strict";
    secure?: boolean;
  };
};

const publicPaths = [
  "/auth",
  "/api/auth/callback",
  "/onboarding",
  "/terms",
  "/privacy-policy",
  "/terms-of-service",
  "/apply",
  "/brands"
];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

  if (!hasSupabaseEnv) {
    if (pathname === "/") return redirectTo(request, "/auth");
    if (!isPublicPath(pathname)) return redirectTo(request, "/auth");
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    supabaseUrl as string,
    supabaseAnonKey as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname === "/") return redirectTo(request, "/auth");
    if (!isPublicPath(pathname)) return redirectTo(request, "/auth");
    return response;
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("status,role,must_reset_password,onboarding_completed")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!creator) {
    if (pathname === "/" || !isPublicPath(pathname)) return redirectTo(request, "/auth");
    return response;
  }

  if (pathname === "/") {
    if (creator.must_reset_password) return redirectTo(request, "/auth/reset-password");
    if (creator.status === "active" && !creator.onboarding_completed) return redirectTo(request, "/onboarding");
    return redirectTo(request, "/profile");
  }

  if (creator.must_reset_password && pathname !== "/auth" && pathname !== "/auth/reset-password") {
    return redirectTo(request, "/auth/reset-password");
  }

  if (["pending", "invited", "suspended", "banned", "rejected"].includes(creator.status)) {
    if (pathname !== "/auth") return redirectTo(request, "/auth");
    return response;
  }

  if (creator.status === "active" && (pathname === "/auth" || pathname === "/auth/reset-password")) {
    return redirectTo(request, creator.onboarding_completed ? "/profile" : "/onboarding");
  }

  if (creator.status === "active" && !creator.onboarding_completed && !pathname.startsWith("/onboarding")) {
    return redirectTo(request, "/onboarding");
  }

  if (pathname.startsWith("/admin") && !["admin", "superadmin"].includes(creator.role)) {
    return redirectTo(request, "/profile");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
