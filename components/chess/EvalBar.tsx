// Chess.com Style Real-Time Evaluation Bar
import React from "react";

interface EvalBarProps {
  winChance: number; // 0 to 100 (for White)
  formattedScore: string; // "+1.2", "-0.8", "M3", "0.0"
  flipped: boolean; // Is board flipped (Black at bottom)?
  className?: string;
  height?: number; // Exact pixel height matching the chessboard
}

export const EvalBar: React.FC<EvalBarProps> = ({
  winChance,
  formattedScore,
  flipped,
  className = "",
  height,
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
      style={height && height > 0 ? { height: `${height}px` } : undefined}
      className={`relative flex ${
        flipped ? "flex-col-reverse" : "flex-col"
      } w-6 sm:w-7 md:w-8 h-full bg-[#262522] rounded-lg overflow-hidden border-2 border-zinc-800 select-none shadow-2xl shrink-0 transition-all duration-150 ${className}`}
      title={`평가치: ${formattedScore} (백 승률: ${winChance}%, 흑 승률: ${100 - winChance}%)`}
    >
      {/* Black portion */}
      <div
        className="w-full bg-[#262522] transition-[height] duration-500 ease-out flex flex-col items-center relative overflow-hidden"
        style={{ height: `${blackHeightPercent}%` }}
      >
        {/* If Black is at top (unflipped), score is displayed near top */}
        {!flipped && (isBlackAdvantage || blackHeightPercent >= 55) && (
          <span className="text-[11px] sm:text-xs font-black text-white px-0.5 tracking-tighter drop-shadow-sm font-mono select-none pt-2">
            {formattedScore.replace("+", "")}
          </span>
        )}
        {/* If Black is at bottom (flipped), score is displayed near bottom */}
        {flipped && (isBlackAdvantage || blackHeightPercent >= 55) && (
          <span className="text-[11px] sm:text-xs font-black text-white px-0.5 tracking-tighter drop-shadow-sm font-mono select-none mt-auto pb-2">
            {formattedScore.replace("+", "")}
          </span>
        )}
      </div>

      {/* 50% Equality Midpoint Tick Marker */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-amber-400/80 -translate-y-1/2 z-10 pointer-events-none shadow-xs" />

      {/* White portion */}
      <div
        className="w-full bg-[#ffffff] transition-[height] duration-500 ease-out flex flex-col items-center relative shadow-inner overflow-hidden"
        style={{ height: `${whiteHeightPercent}%` }}
      >
        {/* If White is at bottom (unflipped), score is displayed near bottom */}
        {!flipped && (isWhiteAdvantage || (!isBlackAdvantage && whiteHeightPercent >= 55)) && (
          <span className="text-[11px] sm:text-xs font-black text-zinc-900 px-0.5 tracking-tighter font-mono select-none mt-auto pb-2">
            {formattedScore}
          </span>
        )}
        {/* If White is at top (flipped), score is displayed near top */}
        {flipped && (isWhiteAdvantage || (!isBlackAdvantage && whiteHeightPercent >= 55)) && (
          <span className="text-[11px] sm:text-xs font-black text-zinc-900 px-0.5 tracking-tighter font-mono select-none pt-2">
            {formattedScore}
          </span>
        )}
      </div>

      {/* Bottom perspective win chance badge */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950/85 px-1 py-0.2 rounded-xs border border-zinc-800 pointer-events-none z-20">
        {bottomPlayerWinRate}%
      </div>
    </div>
  );
};
