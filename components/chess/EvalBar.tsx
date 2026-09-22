// Chess.com Style Real-Time Evaluation Bar
import React from "react";

interface EvalBarProps {
  winChance: number; // 0 to 100 (for White)
  formattedScore: string; // "+1.2", "-0.8", "M3", "0.0"
  flipped: boolean; // Is board flipped (Black at bottom)?
  className?: string;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  winChance,
  formattedScore,
  flipped,
  className = "",
}) => {
  // winChance is White's percentage (0 to 100)
  // Clamp between 3% and 97% for visual clarity so neither side completely vanishes
  const clamped = Math.max(3, Math.min(97, Math.round(winChance)));

  const whiteHeightPercent = clamped;
  const blackHeightPercent = 100 - clamped;

  const isWhiteAdvantage =
    formattedScore.startsWith("+") ||
    (formattedScore.startsWith("M") && !formattedScore.startsWith("-M"));
  const isBlackAdvantage = formattedScore.startsWith("-");

  // Win rate of player currently positioned at the bottom of the board
  const bottomPlayerWinRate = flipped ? blackHeightPercent : whiteHeightPercent;

  return (
    <div
      className={`relative flex ${
        flipped ? "flex-col-reverse" : "flex-col"
      } justify-between w-7 sm:w-8 h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700/80 select-none shadow-xl shrink-0 ${className}`}
      title={`평가치: ${formattedScore} (백 승률: ${winChance}%, 흑 승률: ${100 - winChance}%)`}
    >
      {/* Black portion */}
      <div
        className="w-full bg-[#262522] transition-[height] duration-500 ease-out flex items-center justify-center relative overflow-hidden"
        style={{ height: `${blackHeightPercent}%` }}
      >
        {/* Score in Black portion if Black has advantage or enough room */}
        {(isBlackAdvantage || blackHeightPercent >= 55) && (
          <span className="text-[11px] font-black text-white px-0.5 tracking-tighter drop-shadow-sm font-mono select-none">
            {formattedScore.replace("+", "")}
          </span>
        )}
      </div>

      {/* 50% Equality Midpoint Tick Marker */}
      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-amber-400/70 -translate-y-1/2 z-10 pointer-events-none shadow-xs" />

      {/* White portion */}
      <div
        className="w-full bg-[#ffffff] transition-[height] duration-500 ease-out flex items-center justify-center relative shadow-inner overflow-hidden"
        style={{ height: `${whiteHeightPercent}%` }}
      >
        {/* Score in White portion if White has advantage or enough room */}
        {(isWhiteAdvantage || (!isBlackAdvantage && whiteHeightPercent >= 55)) && (
          <span className="text-[11px] font-black text-zinc-900 px-0.5 tracking-tighter font-mono select-none">
            {formattedScore}
          </span>
        )}
      </div>

      {/* Bottom perspective win chance badge */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-zinc-300 bg-zinc-950/85 px-1 py-0.2 rounded-xs border border-zinc-800 pointer-events-none z-20">
        {bottomPlayerWinRate}%
      </div>
    </div>
  );
};
