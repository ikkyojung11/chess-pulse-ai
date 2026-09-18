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
  // Ensure within reasonable bounds
  const clamped = Math.max(2, Math.min(98, winChance));

  // If flipped is true (Black perspective):
  // Black is at bottom, White is at top
  // White height is clamped%
  const whiteHeightPercent = flipped ? 100 - clamped : clamped;

  const isWhiteAdvantage = formattedScore.startsWith("+") || (formattedScore.startsWith("M") && !formattedScore.startsWith("-M"));
  const isBlackAdvantage = formattedScore.startsWith("-");

  return (
    <div
      className={`relative flex flex-col justify-between w-8 h-full min-h-[360px] bg-zinc-900 rounded-md overflow-hidden border border-zinc-700/80 select-none shadow-lg ${className}`}
      title={`Evaluation: ${formattedScore} (White win chance: ${winChance}%)`}
    >
      {/* Black portion (top or bottom depending on flipped) */}
      <div
        className="w-full bg-[#302e2b] transition-all duration-300 ease-out flex items-center justify-center relative"
        style={{ height: `${100 - whiteHeightPercent}%` }}
      >
        {/* If Black has advantage and black section is large enough, show score here */}
        {(isBlackAdvantage || (!isWhiteAdvantage && whiteHeightPercent < 45)) && (
          <span className="text-[11px] font-bold text-zinc-100 px-0.5 tracking-tighter">
            {formattedScore.replace("+", "")}
          </span>
        )}
      </div>

      {/* White portion */}
      <div
        className="w-full bg-[#f1f1f1] transition-all duration-300 ease-out flex items-center justify-center relative shadow-inner"
        style={{ height: `${whiteHeightPercent}%` }}
      >
        {/* If White has advantage or neutral, show score in white section */}
        {(isWhiteAdvantage || (!isBlackAdvantage && whiteHeightPercent >= 45)) && (
          <span className="text-[11px] font-bold text-zinc-900 px-0.5 tracking-tighter">
            {formattedScore}
          </span>
        )}
      </div>

      {/* Percentage pill at corner */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-400/80 bg-zinc-950/70 px-1 rounded-xs pointer-events-none">
        {flipped ? 100 - winChance : winChance}%
      </div>
    </div>
  );
};
