"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck, Flame, Scissors, ShieldAlert, Check } from "lucide-react";

export function SankeyPipeline() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#EDEBE6] font-display">
              Prompt Inspection Pipeline & Decision Flow
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#C6F432]/10 text-[#C6F432] text-[10px] font-mono font-bold border border-[#C6F432]/20">
              Sankey Telemetry Stream
            </span>
          </div>
          <p className="text-xs text-[#8A8D93] font-sans mt-0.5">
            Real-time trace routing from initial ingress through deterministic rule filters to final action.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
            <span className="text-[#8A8D93]">Allowed (93.0%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
            <span className="text-[#8A8D93]">Redacted (4.4%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF443A]" />
            <span className="text-[#8A8D93]">Blocked (2.6%)</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Flow Diagram */}
      <div className="relative p-5 rounded-2xl bg-[#0A0B0D] border border-[#1F2128] overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F2128_1px,transparent_1px),linear-gradient(to_bottom,#1F2128_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

        {/* 3 Main Stages in Grid Layout */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Stage 1: Ingress (3 cols) */}
          <div
            onMouseEnter={() => setHoveredNode("ingress")}
            onMouseLeave={() => setHoveredNode(null)}
            className={`md:col-span-3 p-4 rounded-xl bg-[#121316] border transition-all cursor-pointer ${
              hoveredNode === "ingress"
                ? "border-[#C6F432] shadow-[0_0_20px_rgba(198,244,50,0.15)]"
                : "border-[#1F2128] hover:border-[#2B2E38]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#C6F432]/10 border border-[#C6F432]/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#C6F432]" />
              </div>
              <span className="text-xs font-mono text-[#8A8D93] uppercase font-bold">STAGE 1</span>
            </div>
            <div className="text-sm font-bold text-[#EDEBE6] font-display">Inbound Prompts</div>
            <div className="text-xl font-mono font-bold text-[#EDEBE6] mt-1">1,842</div>
            <div className="text-[11px] text-[#8A8D93] mt-1 font-sans">
              Raw HTTP / gRPC client payloads
            </div>
          </div>

          {/* SVG Animated Connector Ribbon (Stage 1 -> Stage 2) (1 col) */}
          <div className="hidden md:flex md:col-span-1 items-center justify-center h-24">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 60 20">
              <path
                d="M 0 10 C 30 10, 30 10, 60 10"
                fill="none"
                stroke="#C6F432"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-[dash_1.5s_linear_infinite]"
              />
            </svg>
          </div>

          {/* Stage 2: Inspection Engine (4 cols) */}
          <div
            onMouseEnter={() => setHoveredNode("engine")}
            onMouseLeave={() => setHoveredNode(null)}
            className={`md:col-span-4 p-4 rounded-xl bg-[#121316] border transition-all cursor-pointer ${
              hoveredNode === "engine"
                ? "border-[#64D2FF] shadow-[0_0_20px_rgba(100,210,255,0.15)]"
                : "border-[#1F2128] hover:border-[#2B2E38]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#64D2FF]/10 border border-[#64D2FF]/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#64D2FF]" />
                </div>
                <span className="text-xs font-mono text-[#8A8D93] uppercase font-bold">STAGE 2</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#30D158]/10 text-[#30D158] text-[10px] font-mono font-semibold">
                p95: 0.06ms
              </span>
            </div>
            <div className="text-sm font-bold text-[#EDEBE6] font-display">
              Firewall Policy Engine
            </div>
            <div className="text-xs text-[#8A8D93] mt-1 font-sans leading-relaxed">
              In-memory regex matching, DLP token scanner, & semantic risk scoring
            </div>
          </div>

          {/* SVG Animated Connector Ribbons (Stage 2 -> Stage 3) (1 col) */}
          <div className="hidden md:flex md:col-span-1 items-center justify-center h-24">
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 60 80">
              {/* Allowed ribbon (top) */}
              <path
                d="M 0 40 C 30 40, 30 15, 60 15"
                fill="none"
                stroke="#30D158"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-[dash_1.5s_linear_infinite]"
              />
              {/* Redacted ribbon (middle) */}
              <path
                d="M 0 40 C 30 40, 30 40, 60 40"
                fill="none"
                stroke="#FF9F0A"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-[dash_2s_linear_infinite]"
              />
              {/* Blocked ribbon (bottom) */}
              <path
                d="M 0 40 C 30 40, 30 65, 60 65"
                fill="none"
                stroke="#FF443A"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-[dash_1s_linear_infinite]"
              />
            </svg>
          </div>

          {/* Stage 3: Decisions (3 cols stacked) */}
          <div className="md:col-span-3 space-y-2">
            {/* Allowed */}
            <div
              onMouseEnter={() => setHoveredNode("allowed")}
              onMouseLeave={() => setHoveredNode(null)}
              className={`p-2.5 rounded-xl bg-[#121316] border flex items-center justify-between transition-all cursor-pointer ${
                hoveredNode === "allowed"
                  ? "border-[#30D158] shadow-[0_0_15px_rgba(48,209,88,0.2)]"
                  : "border-[#1F2128]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                <span className="text-xs font-semibold text-[#EDEBE6]">Allowed</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#30D158]">
                1,712 <span className="text-[10px] text-[#8A8D93] font-normal">(93.0%)</span>
              </span>
            </div>

            {/* Redacted */}
            <div
              onMouseEnter={() => setHoveredNode("redacted")}
              onMouseLeave={() => setHoveredNode(null)}
              className={`p-2.5 rounded-xl bg-[#121316] border flex items-center justify-between transition-all cursor-pointer ${
                hoveredNode === "redacted"
                  ? "border-[#FF9F0A] shadow-[0_0_15px_rgba(255,159,10,0.2)]"
                  : "border-[#1F2128]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                <span className="text-xs font-semibold text-[#EDEBE6]">DLP Redacted</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#FF9F0A]">
                82 <span className="text-[10px] text-[#8A8D93] font-normal">(4.4%)</span>
              </span>
            </div>

            {/* Blocked */}
            <div
              onMouseEnter={() => setHoveredNode("blocked")}
              onMouseLeave={() => setHoveredNode(null)}
              className={`p-2.5 rounded-xl bg-[#121316] border flex items-center justify-between transition-all cursor-pointer ${
                hoveredNode === "blocked"
                  ? "border-[#FF443A] shadow-[0_0_15px_rgba(255,68,58,0.2)]"
                  : "border-[#1F2128]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF443A]" />
                <span className="text-xs font-semibold text-[#EDEBE6]">Blocked & Dropped</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#FF443A]">
                48 <span className="text-[10px] text-[#8A8D93] font-normal">(2.6%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
