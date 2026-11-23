"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    timeframe?: string;
  };
  sparkline?: number[];
  variant?: "default" | "red" | "amber" | "emerald" | "sky";
  onClick?: () => void;
  activeTimeRange?: string;
  onTimeRangeChange?: (range: "1h" | "24h" | "7d") => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  sparkline = [4, 7, 5, 8, 12, 9, 14],
  variant = "default",
  onClick,
  activeTimeRange,
  onTimeRangeChange,
  className = "",
}: StatCardProps) {
  const isClickable = Boolean(onClick);

  // Compute normalized sparkline coordinates for 80x24 SVG
  const min = Math.min(...sparkline);
  const max = Math.max(...sparkline) || 1;
  const range = max - min || 1;
  const points = sparkline
    .map((v, i) => {
      const x = (i / (sparkline.length - 1)) * 76 + 2;
      const y = 22 - ((v - min) / range) * 18;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor = {
    default: "#38BDF8",
    red: "#EF4444",
    amber: "#F59E0B",
    emerald: "#10B981",
    sky: "#0284C7",
  }[variant];

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`p-4 rounded-xl bg-[#0F1622] border border-[#1E293B] flex flex-col justify-between transition-all group ${
        isClickable
          ? "cursor-pointer hover:border-[#38BDF8]/40 hover:bg-[#131C2B] hover:shadow-lg focus-ring"
          : ""
      } ${className}`}
    >
      <div>
        {/* Header row: Label + Time range or clickable arrow */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-sans mb-2">
          <span className="font-medium text-slate-300">{label}</span>
          {onTimeRangeChange ? (
            <div
              className="flex items-center gap-1 bg-[#080B10] p-0.5 rounded border border-[#1E293B]"
              onClick={(e) => e.stopPropagation()}
            >
              {(["1h", "24h", "7d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onTimeRangeChange(r)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-sans transition-colors ${
                    activeTimeRange === r
                      ? "bg-[#1E293B] text-white font-medium"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : isClickable ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
          ) : null}
        </div>

        {/* Primary Metric */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-slate-400 font-sans">{subValue}</span>
          )}
        </div>
      </div>

      {/* Footer: Trend indicator + Sparkline */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#1E293B]/60 text-xs font-sans">
        {trend ? (
          <div className="flex items-center gap-1 text-[13px]">
            {trend.isNeutral ? (
              <Minus className="w-3.5 h-3.5 text-slate-400" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
            )}
            <span
              className={
                trend.isNeutral
                  ? "text-slate-400"
                  : trend.isPositive
                  ? "text-emerald-400 font-medium"
                  : "text-red-400 font-medium"
              }
            >
              {trend.value}
            </span>
            {trend.timeframe && (
              <span className="text-slate-500 text-xs ml-0.5 font-sans">
                {trend.timeframe}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-xs font-sans">Updated live</span>
        )}

        {/* Inline SVG Sparkline */}
        <svg
          className="w-20 h-6 shrink-0 overflow-visible"
          viewBox="0 0 80 24"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </div>
  );
}
