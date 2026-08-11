"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import { PageEnter, Stagger, StaggerItem, scaleIn } from "@/components/motion";

const AUTH_ERRORS: Record<string, string> = {
  Callback:
    "Sign-in failed while saving your account. Check that the database is running and DATABASE_URL is correct.",
  OAuthCallback:
    "GitHub returned an error during sign-in. Verify GITHUB_ID and GITHUB_SECRET.",
  OAuthSignin: "Could not start GitHub sign-in. Check your GitHub OAuth app settings.",
  Configuration: "Auth is misconfigured. Check NEXTAUTH_URL and NEXTAUTH_SECRET.",
  AccessDenied: "Access was denied. Try again or use a different GitHub account.",
  Default: "Sign-in failed. Please try again.",
};

function LoginForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? AUTH_ERRORS[errorCode] || AUTH_ERRORS.Default
    : null;

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGitHubSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("GitHub sign-in failed:", err);
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--foreground)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] relative overflow-hidden">
      <Starfield />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <PageEnter className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 10px 30px -8px var(--ring)" }}
              initial="hidden"
              animate="show"
              variants={scaleIn}
            >
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Welcome to Zenith</h1>
            <p className="ui-muted">Sign in to access your collaborative workspace</p>
          </PageEnter>

          <motion.div
            className="ui-panel backdrop-blur-xl rounded-2xl p-8"
            initial="hidden"
            animate="show"
            variants={scaleIn}
          >
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-left text-sm text-[var(--danger)]">
                {errorMessage}
              </div>
            )}

            <motion.button
              onClick={handleGitHubSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              <span>Continue with GitHub</span>
            </motion.button>

            <div className="mt-6 text-center">
              <p className="text-xs ui-muted">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </motion.div>

          <Stagger className="mt-8 grid grid-cols-3 gap-4 text-center">
            <StaggerItem className="p-4">
              <div className="text-2xl mb-2">🚀</div>
              <p className="text-xs ui-muted">Real-time Collaboration</p>
            </StaggerItem>
            <StaggerItem className="p-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-xs ui-muted">Multiple Document Types</p>
            </StaggerItem>
            <StaggerItem className="p-4">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-xs ui-muted">Secure & Private</p>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[var(--foreground)] animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
