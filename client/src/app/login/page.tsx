"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FileText, Github } from "lucide-react";
import Link from "next/link";
import Starfield from "@/components/Starfield";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGithub = async () => {
    setIsLoading(true);
    try {
      await signIn("github", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <Starfield />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f472b6] to-[#ec4899] flex items-center justify-center shadow-[0_0_30px_rgba(244,114,182,0.3)]">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">
            NoteP
          </h1>
          <p className="text-[#a1a1aa] text-lg">
            Collaborative note taking made simple
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl p-8 border border-[#27272a] backdrop-blur-sm">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-[#a1a1aa]">
                Sign in to continue to your documents
              </p>
            </div>

            <button
              onClick={loginWithGithub}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#f472b6] text-white rounded-xl font-semibold hover:bg-[#ec4899] transition-all shadow-[0_0_20px_rgba(244,114,182,0.2)] hover:shadow-[0_0_25px_rgba(244,114,182,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Github className="h-5 w-5" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27272a]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0a0a0a] text-[#52525b]">
                  Secure authentication
                </span>
              </div>
            </div>

            <p className="text-xs text-center text-[#52525b]">
              By signing in, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[#a1a1aa] hover:text-white transition-colors inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
