"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X, RotateCcw } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: ToastOptions[];
  showToast: (options: ToastOptions | string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const toast: ToastOptions =
        typeof options === "string" ? { message: options, type: "info" } : options;
      const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const duration = toast.duration ?? 5000;

      const newToast: ToastOptions = {
        ...toast,
        id,
        type: toast.type || "info",
      };

      setToasts((prev) => [...prev.slice(-4), newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none select-none font-sans"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const type = toast.type || "info";

          const icons = {
            success: <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#FF9F0A] shrink-0" />,
            error: <AlertOctagon className="w-4 h-4 text-[#FF443A] shrink-0" />,
            info: <Info className="w-4 h-4 text-[#C6F432] shrink-0" />,
          };

          const borderColors = {
            success: "border-[#30D158]/30",
            warning: "border-[#FF9F0A]/30",
            error: "border-[#FF443A]/30",
            info: "border-[#C6F432]/30",
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl bg-[#121316]/95 backdrop-blur-md border ${borderColors[type]} shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200`}
            >
              <div className="flex items-start gap-3">
                {icons[type]}
                <div className="space-y-0.5">
                  {toast.title && (
                    <div className="text-xs font-semibold text-[#EDEBE6] font-display">
                      {toast.title}
                    </div>
                  )}
                  <div className="text-xs text-[#8A8D93] leading-relaxed">
                    {toast.message}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {toast.undoAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.undoAction?.();
                      if (toast.id) removeToast(toast.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#C6F432] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{toast.undoLabel || "Undo"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toast.id && removeToast(toast.id)}
                  className="p-1 text-[#565961] hover:text-[#EDEBE6] transition-colors rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
