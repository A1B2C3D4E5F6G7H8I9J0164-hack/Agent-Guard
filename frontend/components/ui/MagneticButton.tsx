"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  onClick,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // Mild, high-end magnetic pull (max 5px)
    x.set((clientX - centerX) * 0.18);
    y.set((clientY - centerY) * 0.18);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const variantStyles = {
    primary:
      "bg-[#C6F432] text-[#0A0B0D] hover:bg-[#D5FA54] border border-[#C6F432] font-semibold shadow-[0_0_20px_rgba(198,244,50,0.18)] hover:shadow-[0_0_28px_rgba(198,244,50,0.32)]",
    secondary:
      "bg-[#16181D] text-[#EDEBE6] hover:bg-[#1E2128] border border-[#262933] hover:border-[#383C4A]",
    ghost:
      "bg-transparent text-[#8A8D93] hover:text-[#EDEBE6] hover:bg-[#16181D] border border-transparent",
    danger:
      "bg-[#2A1215] text-[#FF443A] hover:bg-[#3D1A1E] border border-[#FF443A]/40",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2.5 font-medium",
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: smoothX, y: smoothY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center font-sans tracking-tight transition-colors duration-150 focus-ring cursor-pointer select-none active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...(props as any)}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
