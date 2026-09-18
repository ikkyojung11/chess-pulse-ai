// Pawn Promotion Dialog
import React from "react";
import { Color, PieceSymbol } from "chess.js";
import { ChessPiece } from "./ChessPiece";

interface PawnPromotionModalProps {
  color: Color;
  isOpen: boolean;
  onSelect: (piece: "q" | "r" | "b" | "n") => void;
}

export const PawnPromotionModal: React.FC<PawnPromotionModalProps> = ({
  color,
  isOpen,
  onSelect,
}) => {
  if (!isOpen) return null;

  const choices: Array<{ type: "q" | "r" | "b" | "n"; label: string }> = [
    { type: "q", label: "Queen" },
    { type: "r", label: "Rook" },
    { type: "b", label: "Bishop" },
    { type: "n", label: "Knight" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-lg font-bold text-white mb-1">Pawn Promotion</h3>
        <p className="text-xs text-zinc-400 mb-4">Choose a piece to promote your pawn</p>

        <div className="grid grid-cols-4 gap-3">
          {choices.map((c) => (
            <button
              key={c.type}
              onClick={() => onSelect(c.type)}
              className="group flex flex-col items-center justify-center p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 hover:border-emerald-500/80 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 mb-1 group-hover:scale-110 transition-transform">
                <ChessPiece type={c.type} color={color} />
              </div>
              <span className="text-xs font-medium text-zinc-300 group-hover:text-emerald-400">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
