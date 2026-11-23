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
    critical: "bg-[#FF443A]/15 text-[#FF443A] border-[#FF443A]/30",
    high: "bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30",
    medium: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    low: "bg-[#64D2FF]/10 text-[#64D2FF] border-[#64D2FF]/30",
    info: "bg-[#1F2128] text-[#8A8D93] border-[#2B2E38]",
  };

  const style = styles[norm] || styles.info;
  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`rounded font-mono font-bold uppercase tracking-wider border ${sizeClass} ${style} ${className}`}
    >
      {norm}
    </span>
  );
}
