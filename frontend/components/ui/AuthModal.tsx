"use client";

import React, { useState } from "react";
import { ShieldAlert, Lock, Mail, KeyRound, ArrowRight, X, Sparkles, Check } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("aditya@apexcyber.ai");
  const [password, setPassword] = useState("••••••••••••••••");
  const [loading, setLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"creds" | "mfa">("creds");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (step === "creds") {
        setStep("mfa");
      } else {
        onSuccess?.();
        onClose();
      }
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-[#121316] border border-[#1F2128] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 font-sans">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#15171C] border border-[#C6F432]/40 flex items-center justify-center text-[#C6F432]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#EDEBE6] font-display">
                {step === "creds" ? "Enterprise SOC Sign In" : "Hardware Token MFA"}
              </h3>
              <p className="text-xs text-[#8A8D93] mt-0.5 font-sans">
                {step === "creds"
                  ? "Authenticate to Apex Cyber Systems boundary"
                  : "Enter your 6-digit authenticator or YubiKey code"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === "creds" ? (
            <>
              <div>
                <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">
                  Enterprise SSO / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#C6F432] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs text-[#EDEBE6] focus:outline-none focus:border-[#C6F432] font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-[#8A8D93] mb-1.5 block">
                One-Time Authentication Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#565961] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="849201"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  autoFocus
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-sm text-[#EDEBE6] font-mono tracking-widest text-center focus:outline-none focus:border-[#C6F432]"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs font-sans flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : step === "creds" ? "Continue to MFA" : "Verify & Access Console"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-[#1F2128] flex items-center justify-between text-[11px] font-sans text-[#565961]">
          <span>SOC Identity Guard v1.4</span>
          <span className="text-[#8A8D93]">Apex Zero-Trust ID</span>
        </div>
      </div>
    </div>
  );
}
