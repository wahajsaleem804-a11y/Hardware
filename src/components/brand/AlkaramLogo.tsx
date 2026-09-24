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
        className={`relative flex items-center justify-center shrink-0 rounded-full transition-transform ${
          variant === "badge"
            ? "p-1 bg-gradient-to-b from-[#f8c868]/30 via-[#dfa228]/10 to-transparent border border-[#dfa228]/40 shadow-lg shadow-[#dfa228]/15"
            : ""
        }`}
        style={{ width: dim, height: dim }}
      >
        <img
          src={imageSrc}
          alt="Alkaram Wood Works Logo"
          width={dim}
          height={dim}
          className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(223,162,40,0.35)]"
        />
      </div>

      {showText && (
        <div className={textClassName}>
          <h2 className="font-extrabold text-white tracking-wide text-base leading-tight font-serif">
            Alkaram <span className="text-[#f0b858]">Wood Works</span>
          </h2>
          <p className="text-[11px] text-[#f6e7c1]/80 font-medium tracking-wider uppercase">
            Timber, Doors & Carpentry
          </p>
        </div>
      )}
    </div>
  );
}
