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
      className={`p-8 rounded-xl border border-dashed border-[#1E293B] bg-[#0F1622]/50 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#182335] border border-[#1E293B] flex items-center justify-center text-slate-400">
        {renderIcon()}
      </div>
      <div className="max-w-md space-y-1">
        <h3 className="text-sm font-semibold text-slate-200 font-sans">{title}</h3>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          {description}
        </p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-sans transition-all focus-ring"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  );
}
