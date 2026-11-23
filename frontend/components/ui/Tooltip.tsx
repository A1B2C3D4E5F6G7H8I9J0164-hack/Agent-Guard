"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  content: string;
  term?: string;
  children?: React.ReactNode;
}

export function Tooltip({ content, term, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children || (
        <>
          <span className="border-b border-dotted border-[#565961] text-[#8A8D93] font-sans">
            {term}
          </span>
          <HelpCircle className="w-3 h-3 text-[#565961] hover:text-[#8A8D93] transition-colors" />
        </>
      )}

      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-xl bg-[#121316] border border-[#1F2128] text-xs text-[#EDEBE6] font-sans leading-relaxed shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F2128]" />
        </span>
      )}
    </span>
  );
}
