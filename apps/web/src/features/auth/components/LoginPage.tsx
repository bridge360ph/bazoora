import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import {
  useAuthStore,
  type AuthUser,
} from "@/stores/auth-store";

import { env } from "@/lib/env";

interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

export default function LoginPage() {
  const navigate = useNavigate();

  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const handleLogin = async () => {
  if (!email || !password) {
    setErrorMsg("Please enter both email and password.");
    return;
  }

  setIsLoading(true);
  setErrorMsg(null);



    try {
      const response = await fetch(
        `${env.VITE_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );


      const resData =
  (await response.json()) as LoginResponse;


      if (!response.ok || !resData.success) {
        throw new Error(
          resData.message || "Failed to authenticate."
        );
      }


      const {
        accessToken,
        user,
      } = resData.data;


      // Save login session
      setSession(
        user,
        accessToken,
        keepMeLoggedIn
      );


// Redirect based on user role
const role = user.role.toLowerCase();

switch (role) {
  case "admin":
  case "hauling_admin":
  case "lgu_admin":
    void navigate("/admin");
    break;

  case "driver":
    void navigate("/driver");
    break;

  case "eco_aide":
  case "eco-aide":
  case "ecoaide":
    void navigate("/eco-aide");
    break;

  case "resident":
    void navigate("/resident");
    break;

  default:
    console.warn("Unknown role:", user.role);
    void navigate("/");
    break;
}


    } catch (err: unknown) {

      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(
          "Something went wrong. Please check your connection."
        );
      }

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


        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#092215] text-white font-black text-xl shadow-md">
            🚚
          </div>


          <h2 className="text-3xl font-black tracking-[0.1em] text-[#092215] uppercase leading-none">
            BAZOORA
          </h2>

        </div>



        {/* Login Card */}
        <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xl p-8 relative overflow-hidden">


          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#092215]" />


          <h3 className="text-2xl font-black text-gray-900">
            Login
          </h3>


          <p className="text-sm font-medium text-gray-400 mt-1">
            Enter your credentials to access your route.
          </p>



          <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
        >


            {errorMsg && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-600">
                {errorMsg}
              </div>
            )}



            {/* Email */}
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
                  onChange={(e)=>setEmail(e.target.value)}
                  placeholder="you@organization.gov"
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-4 text-sm focus:bg-white focus:border-[#092215] focus:outline-none"
                />

              </div>

            </div>



            {/* Password */}
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
                  onChange={(e)=>setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full h-12 rounded-xl bg-gray-50 border border-gray-200 pl-11 pr-12 text-sm focus:bg-white focus:border-[#092215] focus:outline-none"
                />


                <button
                  type="button"
                  onClick={()=>setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >

                  {
                    showPassword
                    ? <EyeOff className="w-4 h-4"/>
                    : <Eye className="w-4 h-4"/>
                  }

                </button>

              </div>

            </div>



            {/* Remember */}
            <div className="flex items-center justify-between text-xs">

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={keepMeLoggedIn}
                  onChange={(e)=>setKeepMeLoggedIn(e.target.checked)}
                />

                <span>
                  Keep me logged in
                </span>

              </label>


              <a href="#forgot">
                Forgot Password?
              </a>

            </div>



            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-[#092215] hover:bg-[#133c27] text-white font-bold flex items-center justify-center"
            >

              {
                isLoading
                ? <Loader2 className="animate-spin"/>
                : "Login"
              }

            </button>


          </form>



          <div className="text-center text-xs mt-5 text-gray-500">
            No account yet?{" "}
            <a href="#register" className="font-bold text-[#092215]">
              Register
            </a>
          </div>


        </div>



        {/* Quick Accounts */}
        <div className="w-full bg-white/40 border p-5 rounded-2xl">

          <p className="text-center text-[10px] font-black text-gray-500 uppercase mb-3">
            Quick Test Accounts (Auto-Seed)
          </p>


          <div className="grid grid-cols-2 gap-2">

            {[
              {
                label:"Resident",
                email:"resident@bazoora.com"
              },
              {
                label:"Driver",
                email:"driver@bazoora.com"
              },
              {
                label:"Eco Aide",
                email:"eco@bazoora.com"
              },
              {
                label:"LGU Admin",
                email:"admin@bazoora.com"
              },

            ].map((acc)=>(
              <button
                key={acc.label}
                type="button"
                onClick={()=>handleQuickLogin(acc.email)}
                className="py-2.5 px-3 rounded-xl border bg-white text-left text-xs hover:bg-gray-50"
              >

                <div className="font-bold text-[#092215]">
                  {acc.label}
                </div>

                <div className="truncate text-gray-500">
                  {acc.email}
                </div>

              </button>
            ))}

          </div>

        </div>


      </div>

    </div>
  );
}