"use client";

import React, { useEffect } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AgentGuard runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#EDEBE6] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#121316] border border-[#FF443A]/30 flex items-center justify-center text-[#FF443A] mb-6 shadow-2xl">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#FF443A]">
          SYSTEM EXCEPTION INTERCEPTED
        </span>
        <h1 className="text-3xl font-bold font-display text-[#EDEBE6] tracking-tight">
          Application boundary failure
        </h1>
        <p className="text-sm text-[#8A8D93] font-sans leading-relaxed">
          {error.message || "An unexpected error occurred within the AgentGuard client execution runtime."}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#121316] hover:bg-[#15171C] border border-[#1F2128] text-xs font-semibold text-[#EDEBE6] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-[#C6F432]" />
          <span>Reset runtime session</span>
        </button>
      </div>
    </div>
  );
}
