"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Loader2 } from "lucide-react";
import Starfield from "@/components/Starfield";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <Starfield />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#f472b6] to-[#a855f7] flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Zenith</h1>
            <p className="text-zinc-400">Sign in to access your collaborative workspace</p>
          </div>

          {/* Sign In Card */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
            <button
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              <span>Continue with GitHub</span>
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-xs text-zinc-400">Real-time Collaboration</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-xs text-zinc-400">Multiple Document Types</p>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-xs text-zinc-400">Secure & Private</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
