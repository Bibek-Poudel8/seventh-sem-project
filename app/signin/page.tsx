"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, AuthState } from "@/app/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined,
  );
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── LEFT PANEL ── */}
      <div className="flex flex-1 flex-col justify-between px-12 py-10 lg:px-20 lg:py-14 max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-violet-600 flex items-center justify-center">
            <FontAwesomeIcon icon={faGem} className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">
            FinanceAI
          </span>
        </div>

        {/* Heading */}
        <div className="mt-10 mb-8">
          <h1
            className="text-5xl font-extrabold leading-tight text-gray-900"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}
          >
            Holla,
            <br />
            Welcome Back
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Hey, welcome back to your special place
          </p>
        </div>

        {/* Form */}
        <form action={action} className="flex-1 space-y-4">
          {registered && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              Account created! Sign in below.
            </div>
          )}

          {state?.message && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {state.message}
            </div>
          )}

          {/* Email */}
          <div>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="stanley@gmail.com"
              placeholder="stanley@gmail.com"
              disabled={pending}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition disabled:opacity-50"
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.email[0]}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="············"
              disabled={pending}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition disabled:opacity-50"
            />
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-500">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          {/* Remember me + Forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded accent-violet-600"
              />
              <span className="text-sm text-gray-500">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-gray-400 hover:text-violet-600 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-36 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-95 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="h-4 w-4 animate-spin"
                />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">
              or continue with
            </span>
          </div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition active:scale-95"
        >
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Sign up link */}
        <p className="mt-8 text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Sign Up
          </Link>
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="bg-purple-500 flex-1"></div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
