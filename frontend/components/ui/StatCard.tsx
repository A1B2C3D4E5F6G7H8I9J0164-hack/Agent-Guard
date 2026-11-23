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
  variant?: "default" | "red" | "amber" | "emerald" | "sky" | "lime";
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
    default: "#C6F432",
    lime: "#C6F432",
    red: "#FF443A",
    amber: "#FF9F0A",
    emerald: "#30D158",
    sky: "#64D2FF",
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
      className={`p-4 rounded-xl bg-[#121316] border border-[#1F2128] flex flex-col justify-between transition-all group hover:border-[#2B2E38] ${
        isClickable
          ? "cursor-pointer hover:bg-[#15171C] hover:border-[#C6F432]/40 focus-ring"
          : ""
      } ${className}`}
    >
      <div>
        {/* Header row: Label + Time range or clickable arrow */}
        <div className="flex items-center justify-between text-xs text-[#8A8D93] font-sans mb-2">
          <span className="font-medium text-[#EDEBE6]">{label}</span>
          {onTimeRangeChange ? (
            <div
              className="flex items-center gap-1 bg-[#0A0B0D] p-0.5 rounded border border-[#1F2128]"
              onClick={(e) => e.stopPropagation()}
            >
              {(["1h", "24h", "7d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onTimeRangeChange(r)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    activeTimeRange === r
                      ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                      : "text-[#565961] hover:text-[#8A8D93]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : isClickable ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#565961] group-hover:text-[#C6F432] transition-colors" />
          ) : null}
        </div>

        {/* Primary Metric */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-[#EDEBE6] tracking-tight">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-[#8A8D93] font-sans">{subValue}</span>
          )}
        </div>
      </div>

      {/* Footer: Trend indicator + Sparkline */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1F2128] text-xs font-sans">
        {trend ? (
          <div className="flex items-center gap-1 text-xs">
            {trend.isNeutral ? (
              <Minus className="w-3 h-3 text-[#8A8D93]" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3 text-[#30D158]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-[#FF443A]" />
            )}
            <span
              className={
                trend.isNeutral
                  ? "text-[#8A8D93]"
                  : trend.isPositive
                  ? "text-[#30D158] font-medium"
                  : "text-[#FF443A] font-medium"
              }
            >
              {trend.value}
            </span>
            {trend.timeframe && (
              <span className="text-[#565961] text-[11px] ml-0.5 font-sans">
                {trend.timeframe}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[#565961] text-[11px] font-sans">Updated live</span>
        )}

        {/* Inline SVG Sparkline */}
        <svg
          className="w-20 h-5 shrink-0 overflow-visible"
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
