"use client";

import React, { useState } from "react";
import { Info, Flame } from "lucide-react";

interface HeatmapCell {
  hour: number;
  category: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low" | "none";
}

const CATEGORIES = [
  "Prompt Injection",
  "Secret Exfiltration",
  "Adversarial Jailbreak",
  "Unauthorized Tools",
  "API Schema Abuse",
];

// Generate deterministic 24x5 telemetry pattern
function generateHeatmapData(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const basePatterns = [
    // Prompt Injection peaks in afternoon / evening
    [1, 0, 0, 0, 1, 2, 4, 7, 9, 12, 14, 18, 22, 25, 21, 19, 16, 14, 12, 8, 6, 4, 2, 1],
    // Secret Exfiltration steady during business hours
    [0, 0, 0, 0, 0, 1, 2, 5, 8, 11, 13, 15, 12, 14, 11, 9, 7, 5, 3, 2, 1, 0, 0, 0],
    // Jailbreaks spike late night & midday
    [3, 2, 1, 1, 0, 0, 2, 3, 4, 6, 8, 10, 12, 9, 7, 8, 9, 11, 13, 10, 7, 5, 4, 3],
    // Unauthorized Tools
    [0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 7, 6, 8, 7, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0],
    // API Schema Abuse
    [0, 1, 0, 0, 0, 0, 1, 1, 2, 3, 4, 3, 5, 4, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0],
  ];

  CATEGORIES.forEach((cat, catIdx) => {
    for (let h = 0; h < 24; h++) {
      const count = basePatterns[catIdx][h];
      let severity: HeatmapCell["severity"] = "none";
      if (count >= 18) severity = "critical";
      else if (count >= 10) severity = "high";
      else if (count >= 4) severity = "medium";
      else if (count > 0) severity = "low";

      cells.push({ hour: h, category: cat, count, severity });
    }
  });

  return cells;
}

export function ThreatHeatmap() {
  const [data] = useState<HeatmapCell[]>(generateHeatmapData);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const getCellColor = (count: number, cat: string) => {
    if (count === 0) return "bg-[#15171C] border-[#1F2128]";
    if (cat === "Prompt Injection" || count >= 18) {
      if (count > 15) return "bg-[#FF443A] text-black shadow-[0_0_8px_rgba(255,68,58,0.4)]";
      if (count > 8) return "bg-[#FF443A]/60 text-white";
      return "bg-[#FF443A]/30 text-[#FF443A]";
    }
    if (cat === "Secret Exfiltration") {
      if (count > 10) return "bg-[#FF9F0A] text-black shadow-[0_0_8px_rgba(255,159,10,0.4)]";
      if (count > 5) return "bg-[#FF9F0A]/60 text-white";
      return "bg-[#FF9F0A]/30 text-[#FF9F0A]";
    }
    if (cat === "Adversarial Jailbreak") {
      if (count > 10) return "bg-[#64D2FF] text-black shadow-[0_0_8px_rgba(100,210,255,0.4)]";
      if (count > 5) return "bg-[#64D2FF]/60 text-white";
      return "bg-[#64D2FF]/30 text-[#64D2FF]";
    }
    // General Lime gradient
    if (count > 6) return "bg-[#C6F432] text-black shadow-[0_0_8px_rgba(198,244,50,0.4)]";
    if (count > 3) return "bg-[#C6F432]/60 text-black";
    return "bg-[#C6F432]/25 text-[#C6F432]";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#EDEBE6] font-display">
              24-Hour Attack Category Heatmap
            </h3>
            <span className="px-2 py-0.5 rounded bg-[#C6F432]/10 text-[#C6F432] text-[10px] font-mono uppercase font-bold border border-[#C6F432]/20">
              Live Temporal Matrix
            </span>
          </div>
          <p className="text-xs text-[#8A8D93] font-sans mt-0.5">
            Cross-vector adversary activity distribution by hour of day (UTC)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A8D93]">
          <span>Low</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#15171C] border border-[#1F2128]" />
            <span className="w-3 h-3 rounded bg-[#C6F432]/30" />
            <span className="w-3 h-3 rounded bg-[#FF9F0A]/60" />
            <span className="w-3 h-3 rounded bg-[#FF443A]" />
          </div>
          <span>Peak</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px] space-y-1.5">
          {/* Hour labels header */}
          <div className="grid grid-cols-[140px_repeat(24,1fr)] gap-1 text-[10px] font-mono text-[#565961] text-center">
            <div className="text-left pl-1">Vector</div>
            {hours.map((h) => (
              <div key={h} className={h % 4 === 0 ? "text-[#8A8D93] font-semibold" : ""}>
                {h % 4 === 0 ? `${h.toString().padStart(2, "0")}h` : "·"}
              </div>
            ))}
          </div>

          {/* Rows for each category */}
          {CATEGORIES.map((cat) => {
            const rowCells = data.filter((c) => c.category === cat);
            return (
              <div
                key={cat}
                className="grid grid-cols-[140px_repeat(24,1fr)] gap-1 items-center"
              >
                <div className="text-xs font-sans text-[#8A8D93] truncate pr-2 font-medium">
                  {cat}
                </div>
                {rowCells.map((cell) => {
                  const isHovered =
                    hoveredCell?.category === cell.category && hoveredCell?.hour === cell.hour;
                  return (
                    <div
                      key={cell.hour}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`h-6 rounded-md transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono font-bold ${getCellColor(
                        cell.count,
                        cat
                      )} ${isHovered ? "ring-2 ring-white scale-110 z-10" : ""}`}
                    >
                      {cell.count > 0 && cell.count}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip bar */}
      <div className="h-7 px-3 rounded-lg bg-[#0A0B0D] border border-[#1F2128] flex items-center justify-between text-xs font-mono">
        {hoveredCell ? (
          <div className="flex items-center gap-3 text-[#EDEBE6]">
            <span className="text-[#C6F432] font-semibold">{hoveredCell.category}</span>
            <span className="text-[#8A8D93]">
              Hour: {hoveredCell.hour.toString().padStart(2, "0")}:00 UTC
            </span>
            <span>
              Attacks: <strong className="text-[#FF443A]">{hoveredCell.count}</strong> detected
            </span>
            <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-[#1F2128] text-[#8A8D93]">
              Severity: {hoveredCell.severity}
            </span>
          </div>
        ) : (
          <span className="text-[#565961] text-[11px] font-sans">
            Hover over any hour matrix cell to inspect adversarial density and severity details.
          </span>
        )}
      </div>
    </div>
  );
}
