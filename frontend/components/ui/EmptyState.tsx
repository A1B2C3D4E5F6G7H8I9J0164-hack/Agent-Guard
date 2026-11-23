import React from "react";
import { Sparkles, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = Sparkles,
  title,
  description,
  action,
  children,
  className = "",
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div
      className={`p-8 rounded-2xl border border-dashed border-[#1F2128] bg-[#121316]/60 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-[#15171C] border border-[#1F2128] flex items-center justify-center text-[#8A8D93]">
        {renderIcon()}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-[#EDEBE6] font-display">{title}</h3>
        <p className="text-xs text-[#8A8D93] font-sans leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 px-4 py-1.5 rounded-lg bg-[#C6F432] hover:bg-[#b5e028] text-black font-semibold text-xs font-sans transition-all cursor-pointer focus-ring shadow-sm"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}
