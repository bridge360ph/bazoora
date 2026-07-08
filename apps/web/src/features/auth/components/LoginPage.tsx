import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { env } from "@/lib/env";

export default function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Failed to authenticate.");
      }

      const { accessToken, user } = resData.data;
      setSession(user, accessToken, keepMeLoggedIn);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("password123");
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#f2f6f4] to-[#e4ede8] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-[440px] space-y-6 flex flex-col items-center">
        {/* Old Header Logo and Text */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#092215] text-white font-black text-xl shadow-md">
            🚚
          </div>
          <h2 className="text-3xl font-black tracking-[0.1em] text-[#092215] uppercase leading-none">
            BAZOORA
          </h2>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xl p-8 relative overflow-hidden">
          {/* Top colored accent line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#092215]" />

          <h3 className="text-2xl font-black text-gray-900 leading-tight">Login</h3>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Enter your credentials to access your route.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="rounded-xl bg-red-50 border border-red-200/50 p-4 text-xs font-bold text-red-600 animate-pulse">
                {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.gov"
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#092215] focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-12 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#092215] focus:outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-xs font-bold text-[#092215] pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepMeLoggedIn}
                  onChange={(e) => setKeepMeLoggedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#092215] focus:ring-[#092215] accent-[#092215] cursor-pointer"
                />
                <span className="text-gray-600 font-medium">Keep me logged in</span>
              </label>
              <a href="#forgot" className="hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full h-12 items-center justify-center rounded-xl bg-[#092215] hover:bg-[#133c27] text-sm font-bold text-white shadow-lg active:scale-98 transition-all disabled:opacity-50 mt-6 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center text-xs font-semibold text-gray-500 mt-5">
            No account yet?{" "}
            <a href="#register" className="text-[#092215] font-bold hover:underline">
              Register
            </a>
          </div>
        </div>

        {/* Quick Seeding Drawer (For Dev Testing) */}
        <div className="w-full bg-white/40 border border-white/40 p-5 rounded-2xl backdrop-blur-md shadow-sm">
          <p className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
            Quick Test Accounts (Auto-Seed)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Resident", email: "resident@bazoora.com" },
              { label: "Driver", email: "driver@bazoora.com" },
              { label: "Eco Aide", email: "eco@bazoora.com" },
              { label: "LGU Admin", email: "admin@bazoora.com" },
            ].map((acc) => (
              <button
                key={acc.label}
                onClick={() => handleQuickLogin(acc.email)}
                className="py-2.5 px-3 rounded-xl border border-gray-200/50 bg-white/70 hover:bg-white hover:border-gray-300 text-[11px] font-bold text-gray-600 hover:text-gray-800 transition-all text-left flex flex-col justify-between active:scale-95 cursor-pointer"
              >
                <span className="text-[9px] text-[#092215] uppercase tracking-wider">{acc.label}</span>
                <span className="truncate w-full text-gray-500 mt-0.5">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
