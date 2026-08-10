import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, FormField, Logo } from "@bazoora/ui";

import { useAuthStore } from "@/stores/auth-store";
import { login } from "../authApi";
import { roleHome } from "../roles";

interface LocationState {
  from?: { pathname?: string };
}

const inputClasses =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[13.5px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500";

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { user, accessToken } = await login(email.trim(), password);
      setSession(user, accessToken, rememberMe);

      const state = location.state as LocationState | null;
      const from = state?.from?.pathname;
      navigate(from ?? roleHome(user.role), { replace: true });
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Unable to sign in.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-[420px] rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 sm:px-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Logo className="h-10 w-auto" alt="Bazoora" />
          <div>
            <h1 className="text-xl font-black tracking-wide text-brand">Welcome back</h1>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
              Sign in to your Bazoora account
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <FormField label="Email" required>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              placeholder="you@example.com"
              className={inputClasses}
            />
          </FormField>

          <FormField label="Password" required>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              placeholder="Enter your password"
              className={inputClasses}
            />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              disabled={submitting}
              className="h-4 w-4 rounded border-gray-300 text-brand accent-brand focus:ring-2 focus:ring-brand/20"
            />
            Remember me
          </label>

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
