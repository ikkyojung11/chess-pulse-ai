// Chess.com Authentic Style Move Quality Stickers
import React from "react";
import { UserMoveCategory } from "@/lib/chess/engine";

export interface StickerVisualConfig {
  label: string;
  labelKo: string;
  badgeGradient: string;
  ringColor: string;
  shadowColor: string;
  squareGlowColor: string;
  squareBorderColor: string;
  description: string;
}

export const CHESSCOM_STICKER_CONFIG: Record<UserMoveCategory, StickerVisualConfig> = {
  excellent: {
    label: "Excellent",
    labelKo: "훌륭한 수",
    badgeGradient: "from-[#26b270] to-[#178550]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-emerald-950/70",
    squareGlowColor: "bg-emerald-500/15",
    squareBorderColor: "ring-2 ring-inset ring-emerald-500/70",
    description: "승률 하락이 거의 없는 최적의 수입니다.",
  },
  "very good": {
    label: "Very Good",
    labelKo: "매우 좋은 수",
    badgeGradient: "from-[#00b5e2] to-[#0284c7]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-cyan-950/70",
    squareGlowColor: "bg-cyan-500/15",
    squareBorderColor: "ring-2 ring-inset ring-cyan-500/70",
    description: "포지션 우위를 훌륭하게 유지하는 강한 수입니다.",
  },
  good: {
    label: "Good",
    labelKo: "좋은 수",
    badgeGradient: "from-[#5c8bb0] to-[#36648b]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-blue-950/70",
    squareGlowColor: "bg-blue-500/10",
    squareBorderColor: "ring-2 ring-inset ring-blue-400/50",
    description: "상황에 적절하고 무난하게 좋은 수입니다.",
  },
  mistake: {
    label: "Mistake",
    labelKo: "실수",
    badgeGradient: "from-[#ffa400] to-[#d97706]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-amber-950/70",
    squareGlowColor: "bg-amber-500/20",
    squareBorderColor: "ring-2 ring-inset ring-amber-500/80",
    description: "포지션 우위나 기물 점수를 눈에 띄게 잃은 수입니다.",
  },
  miss: {
    label: "Miss",
    labelKo: "놓친 기회",
    badgeGradient: "from-[#ea1a60] to-[#be123c]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-rose-950/70",
    squareGlowColor: "bg-rose-500/25",
    squareBorderColor: "ring-2 ring-inset ring-rose-500/80",
    description: "상대 실수를 응징하지 못했거나 승리 기회를 놓쳤습니다.",
  },
  blunder: {
    label: "Blunder",
    labelKo: "치명적인 실수",
    badgeGradient: "from-[#fa412d] to-[#b91c1c]",
    ringColor: "ring-white/95",
    shadowColor: "shadow-red-950/80",
    squareGlowColor: "bg-red-500/25",
    squareBorderColor: "ring-2 ring-inset ring-red-500/90",
    description: "승률이 크게 폭락한 결정적 패착입니다.",
  },
};

interface MoveStickerProps {
  category: UserMoveCategory;
  size?: "xs" | "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export const MoveSticker: React.FC<MoveStickerProps> = ({
  category,
  size = "md",
  showTooltip = false,
  className = "",
}) => {
  const config = CHESSCOM_STICKER_CONFIG[category];
  if (!config) return null;

  // Sizing definitions
  const sizeClasses = {
    xs: "w-4 h-4 text-[9px]",
    sm: "w-5 h-5 text-[10px]",
    md: "w-6 h-6 sm:w-7 sm:h-7 text-[11px] sm:text-xs",
    lg: "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm",
  }[size];

  // SVG Icons matching Chess.com sticker aesthetics
  const renderIcon = () => {
    switch (category) {
      case "excellent":
        // 5-pointed star
        return (
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 fill-white filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
          >
            <path d="M12 2.5l2.9 6.2 6.8.9-5 4.8 1.3 6.8-6-3.3-6 3.3 1.3-6.8-5-4.8 6.8-.9L12 2.5z" />
          </svg>
        );

      case "very good":
        // Double checkmark
        return (
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 stroke-white stroke-[3.2] fill-none stroke-linecap-round stroke-linejoin-round filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
          >
            <path d="M2 13l4 4 8-8" />
            <path d="M9 13l4 4 8-8" />
          </svg>
        );

      case "good":
        // Single checkmark
        return (
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 stroke-white stroke-[3.5] fill-none stroke-linecap-round stroke-linejoin-round filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
          >
            <path d="M4 12.5l5.5 5.5L20 6.5" />
          </svg>
        );

      case "mistake":
        // ?! in Chess.com bold typography
        return (
          <span className="font-black text-white leading-none tracking-tight select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            ?!
          </span>
        );

      case "miss":
        // Chess.com Miss Slashed Circle
        return (
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 stroke-white stroke-[3] fill-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
          >
            <circle cx="12" cy="12" r="8.5" />
            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        );

      case "blunder":
        // ?? in Chess.com bold typography
        return (
          <span className="font-black text-white leading-none tracking-tighter select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            ??
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`group relative inline-flex items-center justify-center rounded-full bg-gradient-to-b ${config.badgeGradient} ring-2 ${config.ringColor} shadow-md ${config.shadowColor} cursor-pointer transition-transform hover:scale-115 active:scale-95 duration-150 ease-out select-none ${sizeClasses} ${className}`}
      title={`${config.label} (${config.labelKo}): ${config.description}`}
    >
      {/* Glossy radial overlay for 3D sticker finish */}
      <div className="absolute inset-0 rounded-full bg-radial from-white/35 via-transparent to-black/20 pointer-events-none" />

      {/* Center Icon */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {renderIcon()}
      </div>

      {/* Interactive Tooltip on Hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-zinc-950/95 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-zinc-700/80 shadow-2xl flex flex-col items-center gap-0.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="capitalize">{config.label}</span>
              <span className="text-zinc-400 font-normal">({config.labelKo})</span>
            </div>
            <span className="text-[10px] text-zinc-300 font-normal max-w-[180px] text-center">
              {config.description}
            </span>
          </div>
          {/* Arrow */}
          <div className="w-2 h-2 bg-zinc-950 border-r border-b border-zinc-700/80 transform rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
};
