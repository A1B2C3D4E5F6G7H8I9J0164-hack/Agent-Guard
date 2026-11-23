"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface BentoCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  spotlight?: boolean;
}

export function BentoCard({
  children,
  title,
  subtitle,
  badge,
  headerAction,
  className = "",
  enableTilt = false,
  spotlight = true,
}: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), {
    damping: 20,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), {
    damping: 20,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    setMousePos({ x: localX, y: localY });

    if (enableTilt) {
      const normX = localX / rect.width - 0.5;
      const normY = localY / rect.height - 0.5;
      x.set(normX);
      y.set(normY);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (enableTilt) {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={enableTilt ? { rotateX, rotateY, transformStyle: "preserve-3d" } : {}}
      className={`relative rounded-2xl bg-[#121316] border border-[#1F2128] hover:border-[#2B2E3A] p-5 transition-colors duration-200 overflow-hidden ${className}`}
    >
      {/* Subtle cursor spotlight */}
      {spotlight && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(198, 244, 50, 0.04), transparent 80%)`,
          }}
        />
      )}

      {/* Header if title is present */}
      {(title || headerAction || badge) && (
        <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-sm font-semibold tracking-tight text-[#EDEBE6]">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-[#8A8D93] mt-0.5 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
