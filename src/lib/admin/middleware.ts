import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/config";
import {
  getAdminCookieName,
  parseAdminSession,
} from "@/lib/admin/session";

type Access = {
  authenticated: boolean;
  isAdmin: boolean;
};

/**
 * Protects /admin routes (except login / unauthorized / forgot-password).
 * Verifies session and admin role server-side.
 */
export async function updateAdminSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isPublicAdminPath =
    pathname === "/admin/login" ||
    pathname === "/admin/unauthorized" ||
    pathname === "/admin/forgot-password";

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const access = await resolveAccess(request, (next) => {
    response = next;
  });

  if (!isPublicAdminPath) {
    if (!access.authenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!access.isAdmin) {
      const denied = request.nextUrl.clone();
      denied.pathname = "/admin/unauthorized";
      denied.search = "";
      return NextResponse.redirect(denied);
    }
  }

  if (pathname === "/admin/login" && access.isAdmin) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const dest = request.nextUrl.clone();
    dest.pathname =
      nextParam && nextParam.startsWith("/admin") && !nextParam.startsWith("/admin/login")
        ? nextParam
        : "/admin";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  return response;
}

async function resolveAccess(
  request: NextRequest,
  setResponse: (response: NextResponse) => void,
): Promise<Access> {
  const cookieAdmin = await parseAdminSession(
    request.cookies.get(getAdminCookieName())?.value,
  );

  // Env admin cookie is authoritative when present.
  if (cookieAdmin?.isAdmin && cookieAdmin.mode === "development") {
    return { authenticated: true, isAdmin: true };
  }

  if (!isSupabaseConfigured()) {
    return {
      authenticated: Boolean(cookieAdmin),
      isAdmin: Boolean(cookieAdmin?.isAdmin),
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        setResponse(response);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = Boolean(
    profile?.is_admin && profile.account_status === "active",
  );

  return { authenticated: true, isAdmin };
}