"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { useState } from "react";

export default function MobileLoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // إذا مسجل دخول → وجهه للـ dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  async function handleSubmit() {
    if (!signInLoaded || !signUpLoaded) return;
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          router.replace("/dashboard");
        }
      } else {
        const result = await signUp.create({
          emailAddress: email,
          password,
        });

        if (result.status === "complete") {
          router.replace("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-slate-950">
      
      {/* Header */}
      <div className="bg-blue-600 pt-14 pb-10 px-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <svg viewBox="0 0 48 48" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z"/>
            <path d="M24 14v20M14 24h20" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-white text-2xl font-bold font-cairo">أدابيبنك</h1>
        <p className="text-blue-100 text-sm">منصة الرعاية الصحية الذكية</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pt-8 flex flex-col gap-4">

        {/* Tab toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {m === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </button>
          ))}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            dir="ltr"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-all active:scale-95"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeOpacity={0.3}/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round"/>
              </svg>
              جاري التحميل...
            </span>
          ) : mode === "login" ? "دخول" : "إنشاء حساب"}
        </button>

        {/* نسيت كلمة المرور */}
        {mode === "login" && (
          <button className="text-sm text-blue-500 text-center mt-1">
            نسيت كلمة المرور؟
          </button>
        )}

      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400 pb-8 px-6">
        بتسجيل دخولك توافق على شروط الاستخدام وسياسة الخصوصية
      </p>

    </div>
  );
}