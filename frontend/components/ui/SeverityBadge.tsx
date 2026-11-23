import React from "react";

export type SeverityType = "critical" | "high" | "medium" | "low" | "info" | string;

interface SeverityBadgeProps {
  severity: SeverityType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SeverityBadge({ severity, size = "md", className = "" }: SeverityBadgeProps) {
  const norm = severity?.toLowerCase() || "info";

  const styles: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    medium: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    low: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    info: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const style = styles[norm] || styles.info;
  const sizeClass = size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`rounded font-mono font-bold uppercase tracking-wider border ${sizeClass} ${style} ${className}`}
    >
      {norm}
    </span>
  );
}
