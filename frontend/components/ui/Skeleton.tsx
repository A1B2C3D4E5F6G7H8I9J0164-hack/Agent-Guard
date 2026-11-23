import React from "react";

export function Skeleton({
  className = "",
  rounded = "rounded-lg",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-[#1F2128]/80 ${rounded} ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-[#121316] border border-[#1F2128] space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-28" />
      <div className="pt-2 border-t border-[#1F2128] flex justify-between items-center">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
