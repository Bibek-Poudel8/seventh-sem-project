import { auth } from "@/auth";
import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/signin", "/register"];
const PUBLIC_ROUTES = ["/"];
const LOGIN_ROUTE = "/signin";
const DEFAULT_LOGGED_IN_REDIRECT = "/dashboard";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGGED_IN_REDIRECT, req.url));
  }

  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGGED_IN_REDIRECT, req.url));
  }

  if (pathname === "/" && !isLoggedIn) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, req.url));
  }

  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL(LOGIN_ROUTE, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
