import React from "react";

interface PlaneLoaderProps {
  text?: string;
  className?: string;
}

export function PlaneLoader({ text, className = "" }: PlaneLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="relative w-48 h-12 flex items-center overflow-hidden justify-start">
        {/* 飛行軌跡の点線 */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-primary/30" />
        {/* 左から右へ飛ぶ飛行機 */}
        <div className="w-full flex justify-center z-10">
          <div className="animate-fly-east text-4xl select-none leading-none">
            ✈️
          </div>
        </div>
      </div>
      {text && (
        <p className="mt-3 text-sm font-medium text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
