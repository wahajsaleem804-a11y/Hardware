import React from "react";

interface AlkaramLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  variant?: "transparent" | "solid" | "badge";
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export default function AlkaramLogo({
  size = "md",
  variant = "transparent",
  className = "",
  showText = false,
  textClassName = "",
}: AlkaramLogoProps) {
  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 52,
    xl: 72,
  };

  const dim = typeof size === "number" ? size : pixelSizes[size] || 40;
  const imageSrc = variant === "solid" ? "/brand/logo.png" : "/brand/logo-transparent.png";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 rounded-xl transition-all ${
          variant === "badge"
            ? "p-1.5 bg-slate-800/80 border border-slate-700 shadow-sm"
            : ""
        }`}
        style={{ width: dim, height: dim }}
      >
        <img
          src={imageSrc}
          alt="Alkaram Traders Logo"
          width={dim}
          height={dim}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
        />
      </div>

      {showText && (
        <div className={textClassName}>
          <h2 className="font-extrabold text-white tracking-wide text-base leading-tight">
            Alkaram <span className="text-blue-400">Traders</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
            Hardware, Timber & Building Materials
          </p>
        </div>
      )}
    </div>
  );
}
