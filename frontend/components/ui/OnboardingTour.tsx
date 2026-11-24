"use client";

import React, { useState } from "react";
import { Sparkles, X, ChevronRight, ChevronLeft, ShieldCheck, Activity, Flame, Command } from "lucide-react";
import { NavTab } from "@/components/layout/Sidebar";

interface TourStep {
  title: string;
  description: string;
  tab: NavTab;
  icon: React.ReactNode;
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AgentGuard SOC",
    description:
      "Your digital immune system for production AI. Monitor incoming LLM traffic, inspect prompt injections in sub-millisecond latency, and neutralize autonomous agent anomalies.",
    tab: "overview",
    icon: <ShieldCheck className="w-6 h-6 text-[#C6F432]" />,
    badge: "STEP 1 OF 4",
  },
  {
    title: "Live Threat Monitor & SSE Stream",
    description:
      "Events stream in real time via Server-Sent Events with severity-coded left borders, accent slide-in alerts, and one-click redaction diff & JSON forensics.",
    tab: "threats",
    icon: <Activity className="w-6 h-6 text-[#FF443A]" />,
    badge: "STEP 2 OF 4",
  },
  {
    title: "AI Firewall & Policy-as-Code",
    description:
      "Test adversarial payloads directly in the Inspection Bench or manage deterministic rules in our built-in Policy-as-Code editor with dry-run simulation and version rollback.",
    tab: "firewall",
    icon: <Flame className="w-6 h-6 text-[#FF9F0A]" />,
    badge: "STEP 3 OF 4",
  },
  {
    title: "Command Palette & Shortcuts (Cmd+K)",
    description:
      "Press Cmd+K (or Ctrl+K) from any screen to search rules, switch firewall enforcement modes, or simulate live attacks instantly. Press '?' in Settings for full shortcuts.",
    tab: "overview",
    icon: <Command className="w-6 h-6 text-[#64D2FF]" />,
    badge: "STEP 4 OF 4",
  },
];

export function OnboardingTour({
  isOpen,
  onClose,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const current = TOUR_STEPS[stepIndex];

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      onNavigate(TOUR_STEPS[nextIdx].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      const prevIdx = stepIndex - 1;
      setStepIndex(prevIdx);
      onNavigate(TOUR_STEPS[prevIdx].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#121316] border border-[#C6F432]/40 shadow-[0_0_50px_rgba(198,244,50,0.12)] p-6 space-y-5 font-sans relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#1F2128] transition-colors cursor-pointer"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Badge & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0B0D] border border-[#1F2128] flex items-center justify-center shrink-0">
            {current.icon}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#C6F432] tracking-wider uppercase">
              {current.badge}
            </span>
            <h3 className="text-base font-bold text-[#EDEBE6] font-display mt-0.5">
              {current.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#8A8D93] leading-relaxed">{current.description}</p>

        {/* Progress Dots & Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-[#1F2128]">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIndex ? "w-5 bg-[#C6F432]" : "w-1.5 bg-[#1F2128]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg bg-[#0A0B0D] hover:bg-[#1A1C22] border border-[#1F2128] text-xs text-[#8A8D93] hover:text-[#EDEBE6] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{stepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
              {stepIndex < TOUR_STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
