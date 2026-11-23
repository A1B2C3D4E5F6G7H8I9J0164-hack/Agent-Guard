import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  statusLine?: string;
  badge?: {
    text: string;
    variant?: "emerald" | "amber" | "red" | "sky";
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
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  }[badge?.variant || "emerald"];

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#1E293B]">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            {title}
          </h1>
          {badge && (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase border ${badgeClasses}`}
            >
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl font-sans">
          {description}
        </p>
        {statusLine && (
          <div className="text-[13px] text-slate-500 font-sans flex items-center gap-2 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{statusLine}</span>
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
