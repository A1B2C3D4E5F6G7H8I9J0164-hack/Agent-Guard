"use client";

import React, { useState, useMemo } from "react";
import { SlidersHorizontal, ShieldCheck, ShieldAlert, Clock, RefreshCw } from "lucide-react";

interface TimelinePoint {
  time: string;
  hour: number;
  threats: number;
  blocked: number;
  anomalies: number;
}

const RAW_TIMELINE: TimelinePoint[] = [
  { time: "00:00", hour: 0, threats: 4, blocked: 4, anomalies: 1 },
  { time: "02:00", hour: 2, threats: 3, blocked: 3, anomalies: 0 },
  { time: "04:00", hour: 4, threats: 2, blocked: 2, anomalies: 0 },
  { time: "06:00", hour: 6, threats: 6, blocked: 6, anomalies: 1 },
  { time: "08:00", hour: 8, threats: 15, blocked: 14, anomalies: 3 },
  { time: "10:00", hour: 10, threats: 24, blocked: 23, anomalies: 4 },
  { time: "12:00", hour: 12, threats: 38, blocked: 36, anomalies: 7 },
  { time: "14:00", hour: 14, threats: 42, blocked: 41, anomalies: 8 },
  { time: "16:00", hour: 16, threats: 35, blocked: 33, anomalies: 6 },
  { time: "18:00", hour: 18, threats: 28, blocked: 27, anomalies: 4 },
  { time: "20:00", hour: 20, threats: 19, blocked: 18, anomalies: 2 },
  { time: "22:00", hour: 22, threats: 11, blocked: 10, anomalies: 1 },
];

export function BrushableTimeline() {
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(24);

  // Filter points within selected brush range
  const filteredPoints = useMemo(() => {
    return RAW_TIMELINE.filter((p) => p.hour >= startHour && p.hour <= endHour);
  }, [startHour, endHour]);

  // Aggregate stats
  const totalThreats = filteredPoints.reduce((acc, p) => acc + p.threats, 0);
  const totalBlocked = filteredPoints.reduce((acc, p) => acc + p.blocked, 0);
  const defenseRate = totalThreats > 0 ? ((totalBlocked / totalThreats) * 100).toFixed(1) : "100.0";

  const maxVal = Math.max(...RAW_TIMELINE.map((t) => t.threats), 50);

  const handlePreset = (preset: "all" | "workday" | "morning" | "night") => {
    if (preset === "all") {
      setStartHour(0);
      setEndHour(24);
    } else if (preset === "workday") {
      setStartHour(8);
      setEndHour(18);
    } else if (preset === "morning") {
      setStartHour(6);
      setEndHour(12);
    } else if (preset === "night") {
      setStartHour(18);
      setEndHour(24);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Brush Range summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#EDEBE6] font-display">
              Brushable Threat Timeline & Attack Velocity
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#C6F432]/10 text-[#C6F432] text-[10px] font-mono font-bold border border-[#C6F432]/20">
              Interactive Time-Brush
            </span>
          </div>
          <p className="text-xs text-[#8A8D93] font-sans mt-0.5">
            Drag the time window sliders below to zoom in on specific incident bursts.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 bg-[#0A0B0D] p-1 rounded-xl border border-[#1F2128] text-xs">
          <button
            type="button"
            onClick={() => handlePreset("all")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              startHour === 0 && endHour === 24
                ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                : "text-[#8A8D93] hover:text-[#EDEBE6]"
            }`}
          >
            24h Full
          </button>
          <button
            type="button"
            onClick={() => handlePreset("workday")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              startHour === 8 && endHour === 18
                ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                : "text-[#8A8D93] hover:text-[#EDEBE6]"
            }`}
          >
            08:00–18:00 (Workday)
          </button>
          <button
            type="button"
            onClick={() => handlePreset("night")}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              startHour === 18 && endHour === 24
                ? "bg-[#1F2128] text-[#C6F432] font-semibold"
                : "text-[#8A8D93] hover:text-[#EDEBE6]"
            }`}
          >
            18:00–24:00 (Evening)
          </button>
        </div>
      </div>

      {/* Filtered Range Metrics Banner */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#0A0B0D] border border-[#1F2128] text-xs">
        <div>
          <span className="text-[#8A8D93] font-sans">Active Time Window</span>
          <div className="font-mono text-[#EDEBE6] font-semibold mt-0.5">
            {startHour.toString().padStart(2, "0")}:00 – {endHour.toString().padStart(2, "0")}:00 UTC
          </div>
        </div>
        <div>
          <span className="text-[#8A8D93] font-sans">Threats in Scope</span>
          <div className="font-mono text-[#FF443A] font-bold mt-0.5 text-sm">
            {totalThreats} attacks
          </div>
        </div>
        <div>
          <span className="text-[#8A8D93] font-sans">Autonomous Interception</span>
          <div className="font-mono text-[#30D158] font-bold mt-0.5 text-sm">
            {totalBlocked} blocked ({defenseRate}%)
          </div>
        </div>
      </div>

      {/* Main Bar Chart with brushable indicator */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 px-1 border-b border-[#1F2128]">
        {RAW_TIMELINE.map((item) => {
          const isInRange = item.hour >= startHour && item.hour <= endHour;
          const threatH = Math.round((item.threats / maxVal) * 100);
          const blockedH = Math.round((item.blocked / maxVal) * 100);

          return (
            <div
              key={item.time}
              className={`flex-1 flex flex-col items-center gap-1.5 h-full justify-end group transition-opacity ${
                isInRange ? "opacity-100" : "opacity-25"
              }`}
            >
              <div className="w-full flex items-end justify-center gap-1 h-32">
                {/* Total Threats */}
                <div
                  className="w-1/2 max-w-[16px] rounded-t bg-[#FF443A]/80 group-hover:bg-[#FF443A] transition-all relative"
                  style={{ height: `${threatH}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black text-[10px] font-mono text-[#EDEBE6] whitespace-nowrap pointer-events-none transition-opacity z-10">
                    {item.threats}
                  </span>
                </div>
                {/* Blocked */}
                <div
                  className="w-1/2 max-w-[16px] rounded-t bg-[#30D158]/80 group-hover:bg-[#30D158] transition-all"
                  style={{ height: `${blockedH}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[#8A8D93] whitespace-nowrap">
                {item.time}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dual Brush Sliders */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8D93]">
          <span>Window Start: {startHour.toString().padStart(2, "0")}:00</span>
          <span className="text-[#C6F432]">Drag handles to filter</span>
          <span>Window End: {endHour.toString().padStart(2, "0")}:00</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="range"
            min="0"
            max={endHour - 2}
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full accent-[#C6F432] cursor-pointer"
          />
          <input
            type="range"
            min={startHour + 2}
            max="24"
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full accent-[#C6F432] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
