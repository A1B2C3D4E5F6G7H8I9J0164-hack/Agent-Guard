import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  statusLine?: string;
  badge?: {
    text: string;
    variant?: "lime" | "emerald" | "amber" | "red" | "sky";
  };
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  statusLine,
  badge,
  actions,
}: PageHeaderProps) {
  const badgeClasses = {
    lime: "bg-[#C6F432]/10 text-[#C6F432] border-[#C6F432]/30",
    emerald: "bg-[#30D158]/10 text-[#30D158] border-[#30D158]/30",
    amber: "bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/30",
    red: "bg-[#FF443A]/10 text-[#FF443A] border-[#FF443A]/30",
    sky: "bg-[#64D2FF]/10 text-[#64D2FF] border-[#64D2FF]/30",
  }[badge?.variant || "lime"];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#1F2128]">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#EDEBE6] font-display">
            {title}
          </h1>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${badgeClasses}`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-sm text-[#8A8D93] leading-relaxed max-w-3xl font-sans">
          {description}
        </p>
        {statusLine && (
          <div className="text-xs text-[#565961] font-sans flex items-center gap-2 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6F432] animate-pulse" />
            <span>{statusLine}</span>
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
