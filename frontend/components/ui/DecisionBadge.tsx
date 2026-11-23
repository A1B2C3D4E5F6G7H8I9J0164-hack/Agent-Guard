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

  let bg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let label = "ALLOWED";
  let Icon = ShieldCheck;

  if (norm === "block" || norm === "blocked") {
    bg = "bg-red-500/15 text-red-400 border-red-500/40 glow-red";
    label = "BLOCKED";
    Icon = ShieldX;
  } else if (norm === "redact" || norm === "redacted") {
    bg = "bg-amber-500/15 text-amber-400 border-amber-500/40 glow-amber";
    label = "REDACTED";
    Icon = Eye;
  } else if (norm === "quarantine" || norm === "quarantined") {
    bg = "bg-purple-500/15 text-purple-400 border-purple-500/40";
    label = "QUARANTINED";
    Icon = Lock;
  } else if (norm === "monitor" || norm === "monitored") {
    bg = "bg-sky-500/10 text-sky-400 border-sky-500/30";
    label = "MONITORED";
    Icon = Shield;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2 font-bold",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md font-mono font-bold tracking-wider uppercase border ${bg} ${sizeClasses} ${className}`}
    >
      <Icon className={iconSizes} />
      <span>{label}</span>
    </span>
  );
}
