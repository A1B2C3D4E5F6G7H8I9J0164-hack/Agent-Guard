"use client";

import React from "react";
import { X } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#15171C] transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <AuthCard
          mode="signin"
          onSuccess={() => {
            onSuccess?.();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
