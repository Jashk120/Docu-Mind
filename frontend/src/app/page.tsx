"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="bg-background text-on-background font-body-md antialiased overflow-hidden selection:bg-primary/30 selection:text-primary min-h-screen">
      <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#dae2fd 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-panel rounded-xl p-10 flex flex-col items-center text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-300 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-950/50 mb-3 mx-auto">
                <span className="material-symbols-outlined text-white text-[40px]">psychology</span>
              </div>
              <h1 className="text-5xl font-extrabold gradient-text tracking-tighter font-[Manrope]">DocuMind AI</h1>
              <p className="text-[#a1a1aa] mt-2">AI-powered documentation for any codebase</p>
            </div>

            <button
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-950 hover:bg-white active:scale-[0.98] transition-all duration-300 py-4 px-6 rounded-lg font-semibold shadow-xl shadow-indigo-950/20"
            >
              <span className="material-symbols-outlined text-[24px]">terminal</span>
              <span>Continue with GitHub</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent blur-sm rounded-full" />
      </div>
    </main>
  );
}
