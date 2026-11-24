"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface AuthCardProps {
  mode: "signin" | "register";
  onSuccess?: () => void;
}

export function AuthCard({ mode, onSuccess }: AuthCardProps) {
  const router = useRouter();
  const {
    googleClientId,
    gsiReady,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogleAccessToken,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gsiReady || !googleClientId || !googleBtnRef.current) return;
    if (window.google?.accounts?.id) {
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        text: mode === "signin" ? "continue_with" : "signup_with",
        shape: "pill",
        width: 360,
      });
    }
  }, [gsiReady, googleClientId, mode]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.replace("/?mode=console");
    }
  };

  const handleGoogleOAuthPopup = () => {
    setError(null);
    if (!googleClientId) {
      setError("Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment to enable Google Sign-In.");
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      setError("Google Identity Services is still loading. Please try again.");
      return;
    }
    setLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: "openid email profile",
      callback: async (tokenResponse) => {
        try {
          if (tokenResponse.error || !tokenResponse.access_token) {
            throw new Error(tokenResponse.error || "Google sign-in was cancelled");
          }
          await signInWithGoogleAccessToken(tokenResponse.access_token);
          handleSuccess();
        } catch (err: any) {
          setError(err?.message || "Google sign-in failed");
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, fullName || undefined);
      }
      handleSuccess();
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#121316] border border-[#1F2128] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#15171C] border border-[#C6F432]/40 flex items-center justify-center text-[#C6F432]">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#EDEBE6] font-display">
            {mode === "signin" ? "Sign in to AgentGuard" : "Create your AgentGuard Account"}
          </h1>
          <p className="text-xs text-[#8A8D93] mt-0.5">
            {mode === "signin"
              ? "Access your AI Security Operations Center"
              : "Start protecting your LLM & agent workflows"}
          </p>
        </div>
      </div>

      {/* Google Sign-In */}
      <div className="space-y-2.5">
        {googleClientId && gsiReady ? (
          <div className="flex justify-center" ref={googleBtnRef} />
        ) : (
          <button
            type="button"
            onClick={handleGoogleOAuthPopup}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{mode === "signin" ? "Continue with Google" : "Sign up with Google"}</span>
          </button>
        )}
      </div>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[#1F2128]" />
        <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#565961]">or</span>
        <div className="flex-grow border-t border-[#1F2128]" />
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-[#FF443A]/10 border border-[#FF443A]/30 text-[#FF443A] text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "register" && (
          <div>
            <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#C6F432]"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#C6F432]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#C6F432] font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
        >
          <span>{loading ? "Authenticating..." : mode === "signin" ? "Sign In" : "Create Account"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="pt-3 border-t border-[#1F2128] flex items-center justify-between text-xs text-[#8A8D93]">
        {mode === "signin" ? (
          <Link href="/signup" className="text-[#C6F432] hover:underline">
            Need an account? Sign up
          </Link>
        ) : (
          <Link href="/login" className="text-[#C6F432] hover:underline">
            Already have an account? Sign in
          </Link>
        )}
        <Link href="/" className="text-[#565961] hover:text-[#EDEBE6]">
          Back to home
        </Link>
      </div>
    </div>
  );
}
