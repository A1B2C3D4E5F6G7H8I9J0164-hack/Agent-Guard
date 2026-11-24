"use client";

import React, { useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

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

  // Render animated or formatted value
  const renderValue = () => {
    if (typeof value === "number") {
      return <AnimatedCounter value={value} />;
    }
    const matchPct = String(value).match(/^([\d.]+)(%)$/);
    if (matchPct) {
      return (
        <AnimatedCounter
          value={parseFloat(matchPct[1])}
          decimals={matchPct[1].includes(".") ? 1 : 0}
          suffix="%"
        />
      );
    }
    const matchSlash = String(value).match(/^([\d.]+)\s*\/\s*100$/);
    if (matchSlash) {
      return (
        <span>
          <AnimatedCounter value={parseFloat(matchSlash[1])} /> / 100
        </span>
      );
    }
    const matchNum = String(value).replace(/,/g, "");
    if (!isNaN(Number(matchNum)) && matchNum.trim() !== "") {
      return <AnimatedCounter value={Number(matchNum)} />;
    }
    return value;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`relative overflow-hidden p-4 rounded-xl bg-[#121316] border border-[#1F2128] flex flex-col justify-between transition-all group hover:border-[#2B2E38] ${
        isClickable
          ? "cursor-pointer hover:bg-[#15171C] hover:border-[#C6F432]/40 focus-ring"
          : ""
      } ${className}`}
    >
      {/* Soft spotlight radial gradient following cursor */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(220px circle at ${mousePos.x}px ${mousePos.y}px, rgba(198, 244, 50, 0.08), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
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
            {renderValue()}
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
