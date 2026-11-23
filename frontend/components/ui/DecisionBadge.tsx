import React from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Shield, Eye, Lock } from "lucide-react";

export type DecisionType = "allow" | "block" | "redact" | "quarantine" | "monitor" | string;

interface DecisionBadgeProps {
  decision: DecisionType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DecisionBadge({ decision, size = "md", className = "" }: DecisionBadgeProps) {
  const norm = decision?.toLowerCase() || "allow";

  let bg = "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30";
  let label = "ALLOWED";
  let Icon = ShieldCheck;

  if (norm === "block" || norm === "blocked") {
    bg = "bg-[#FF443A]/15 text-[#FF443A] border-[#FF443A]/40";
    label = "BLOCKED";
    Icon = ShieldX;
  } else if (norm === "redact" || norm === "redacted") {
    bg = "bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/40";
    label = "REDACTED";
    Icon = Eye;
  } else if (norm === "quarantine" || norm === "quarantined") {
    bg = "bg-purple-500/15 text-purple-400 border-purple-500/40";
    label = "QUARANTINED";
    Icon = Lock;
  } else if (norm === "monitor" || norm === "monitored") {
    bg = "bg-[#64D2FF]/10 text-[#64D2FF] border-[#64D2FF]/30";
    label = "MONITORED";
    Icon = Shield;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3.5 py-1.5 text-xs gap-2 font-bold",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded font-mono font-bold tracking-wider uppercase border ${bg} ${sizeClasses} ${className}`}
    >
      <Icon className={iconSizes} />
      <span>{label}</span>
    </span>
  );
}
