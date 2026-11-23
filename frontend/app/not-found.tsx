"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#EDEBE6] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#121316] border border-[#1F2128] flex items-center justify-center text-[#C6F432] mb-6 shadow-2xl">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#C6F432]">
          404 · ACCESS POINT NOT FOUND
        </span>
        <h1 className="text-3xl font-bold font-display text-[#EDEBE6] tracking-tight">
          Resource does not exist
        </h1>
        <p className="text-sm text-[#8A8D93] font-sans leading-relaxed">
          The requested inspection endpoint, rule manifest, or SOC telemetry stream was not found or has been quarantined.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/?mode=console&tab=overview"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs font-sans transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to SOC console</span>
        </Link>
      </div>
    </div>
  );
}
