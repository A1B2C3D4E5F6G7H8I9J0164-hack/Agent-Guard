import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load telemetry",
  message = "An error occurred while connecting to the AgentGuard backend service.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`p-6 rounded-2xl bg-[#121316] border border-[#FF443A]/30 flex flex-col items-center text-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-[#FF443A]/10 border border-[#FF443A]/20 flex items-center justify-center text-[#FF443A]">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[#EDEBE6] font-display">{title}</h4>
        <p className="text-xs text-[#8A8D93] max-w-sm font-sans">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#15171C] hover:bg-[#1A1C22] border border-[#1F2128] text-xs text-[#EDEBE6] font-sans transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C6F432]" />
          <span>Retry connection</span>
        </button>
      )}
    </div>
  );
}
