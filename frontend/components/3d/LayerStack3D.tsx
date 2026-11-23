"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Filter, EyeOff, ArrowRight } from "lucide-react";

interface LayerData {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  latency: string;
  metrics: string;
  icon: React.ReactNode;
  rules: string[];
}

const LAYERS: LayerData[] = [
  {
    id: "prompt",
    number: "01",
    title: "Inbound Prompt Inspection",
    subtitle: "Real-time semantic membrane",
    description:
      "Vector embeddings and heuristic tokenizers classify intent before the request touches LLM runtime. Blocks direct overrides, DAN jailbreaks, and indirect injection vectors.",
    latency: "< 1.4ms",
    metrics: "99.8% precision",
    icon: <ShieldCheck className="w-5 h-5 text-[#C6F432]" />,
    rules: ["Adversarial instruction override", "Base64 & unicode obfuscation", "System prompt extraction"],
  },
  {
    id: "policy",
    number: "02",
    title: "Deterministic Policy Engine",
    subtitle: "Zero-latency compliance gate",
    description:
      "Hard enforcement rules run locally in memory. Evaluates regex signatures, DLP policies, organizational boundaries, and tool whitelist gates.",
    latency: "< 0.3ms",
    metrics: "Deterministic",
    icon: <Filter className="w-5 h-5 text-[#64D2FF]" />,
    rules: ["API Key & credential hunter", "GDPR / HIPAA PII patterns", "Unauthorized shell execution gate"],
  },
  {
    id: "redaction",
    number: "03",
    title: "Output Redaction & Sanitization",
    subtitle: "Reverse-proxy response filter",
    description:
      "Inspects model completions before delivery to end users or API consumers. Replaces matched leaks with cryptographic redact tokens and audits confidence.",
    latency: "< 1.8ms",
    metrics: "Zero data leakage",
    icon: <EyeOff className="w-5 h-5 text-[#FF9F0A]" />,
    rules: ["Token-level secret masking", "Differential highlight view", "Hallucination & toxicity drop"],
  },
];

export function LayerStack3D() {
  const [activeLayer, setActiveLayer] = useState<number>(0);

  return (
    <div className="w-full py-20 border-t border-[#1F2128]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C6F432]/10 border border-[#C6F432]/25 text-[#C6F432] text-xs font-mono mb-3">
              <span>TRIPLE-LAYER DEFENSE ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-[#EDEBE6]">
              Every prompt inspected. Every leak redacted. Under 2ms.
            </h2>
          </div>
          <p className="text-sm text-[#8A8D93] max-w-md leading-relaxed font-normal">
            Three decoupled, zero-overhead enforcement stages protect your models from hostile inputs and exfiltration.
          </p>
        </div>

        {/* 3D Stacked Planes Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 3D Stack Visualizer */}
          <div className="lg:col-span-6 relative h-[380px] flex items-center justify-center perspective-1000">
            {LAYERS.map((layer, idx) => {
              const isActive = activeLayer === idx;
              const yOffset = (idx - 1) * 85;
              const zOffset = isActive ? 40 : (idx - 1) * -30;
              const rotateX = 22;
              const rotateY = -12;

              return (
                <motion.div
                  key={layer.id}
                  onClick={() => setActiveLayer(idx)}
                  animate={{
                    y: yOffset,
                    z: zOffset,
                    rotateX: rotateX,
                    rotateY: rotateY,
                    scale: isActive ? 1.04 : 0.96,
                    opacity: isActive ? 1 : 0.65,
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className={`absolute w-full max-w-md h-36 rounded-2xl p-5 cursor-pointer border transition-all duration-200 backdrop-blur-md select-none ${
                    isActive
                      ? "bg-[#181A20] border-[#C6F432] shadow-[0_10px_35px_rgba(198,244,50,0.14)]"
                      : "bg-[#121316]/90 border-[#1F2128] hover:border-[#2C303E]"
                  }`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0A0B0D] border border-[#1F2128] flex items-center justify-center">
                        {layer.icon}
                      </div>
                      <div>
                        <span className="text-xs font-mono text-[#8A8D93]">LAYER {layer.number}</span>
                        <h4 className="text-sm font-semibold text-[#EDEBE6]">{layer.title}</h4>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#C6F432] px-2 py-0.5 rounded bg-[#C6F432]/10 border border-[#C6F432]/20">
                      {layer.latency}
                    </span>
                  </div>

                  <p className="text-xs text-[#8A8D93] line-clamp-2 mt-2 font-normal leading-relaxed">
                    {layer.subtitle} — {layer.metrics}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Active Layer Detail Breakdown */}
          <div className="lg:col-span-6 bg-[#121316] rounded-2xl border border-[#1F2128] p-7 relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#C6F432]/10 border border-[#C6F432]/30 text-[#C6F432]">
                LAYER {LAYERS[activeLayer].number} ACTIVE
              </span>
              <span className="text-xs text-[#8A8D93] font-mono">
                P99 LATENCY: {LAYERS[activeLayer].latency}
              </span>
            </div>

            <h3 className="text-xl font-display font-semibold text-[#EDEBE6] mb-2">
              {LAYERS[activeLayer].title}
            </h3>
            <p className="text-sm text-[#8A8D93] leading-relaxed mb-6 font-normal">
              {LAYERS[activeLayer].description}
            </p>

            <div className="space-y-2 mb-6">
              <span className="text-xs font-mono uppercase tracking-wider text-[#565961]">
                Enforced Safeguards
              </span>
              <div className="grid grid-cols-1 gap-2">
                {LAYERS[activeLayer].rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0A0B0D] border border-[#1F2128]"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C6F432]" />
                    <span className="text-xs font-mono text-[#EDEBE6]">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1F2128]">
              <span className="text-xs text-[#8A8D93]">Click any layer on the left to inspect</span>
              <button
                onClick={() => setActiveLayer((prev) => (prev + 1) % LAYERS.length)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C6F432] hover:text-[#D5FA54] transition-colors cursor-pointer"
              >
                Next layer <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
