// Real-Time Analysis & Study Panel (Best Move, Move Quality, Eval & Move List)
import React, { useRef, useEffect } from "react";
import { Move } from "chess.js";
import { EngineEvaluation, MoveQuality } from "@/lib/chess/engine";
import { ChessOpening } from "@/lib/chess/openings";
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
} from "lucide-react";

interface AnalysisPanelProps {
  evaluation: EngineEvaluation | null;
  lastMoveQuality: MoveQuality | null;
  opening: ChessOpening | null;
  moves: Move[];
  currentMoveIndex: number; // -1 for starting position, 0 for move 1, etc.
  onJumpToMove: (index: number) => void;
  showBestMoveArrow: boolean;
  onToggleArrow: () => void;
  fen: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  evaluation,
  lastMoveQuality,
  opening,
  moves,
  currentMoveIndex,
  onJumpToMove,
  showBestMoveArrow,
  onToggleArrow,
  fen,
}) => {
  const [copiedFen, setCopiedFen] = React.useState(false);
  const moveListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll move history to bottom when new move is added
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moves.length]);

  const copyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  const getQualityBadge = (quality: MoveQuality) => {
    switch (quality) {
      case "best":
        return {
          label: "Best Move",
          color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: "★",
        };
      case "excellent":
        return {
          label: "Excellent",
          color: "bg-teal-500/20 text-teal-400 border-teal-500/40",
          icon: "✓",
        };
      case "good":
        return {
          label: "Good",
          color: "bg-sky-500/20 text-sky-400 border-sky-500/40",
          icon: "•",
        };
      case "inaccuracy":
        return {
          label: "Inaccuracy",
          color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
          icon: "?!",
        };
      case "mistake":
        return {
          label: "Mistake",
          color: "bg-orange-500/20 text-orange-400 border-orange-500/40",
          icon: "?",
        };
      case "blunder":
        return {
          label: "Blunder",
          color: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: "??",
        };
    }
  };

  // Group moves into pairs (White & Black)
  const movePairs: Array<{ number: number; white?: Move; black?: Move; whiteIdx: number; blackIdx: number }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIdx: i,
      blackIdx: i + 1,
    });
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header with Engine Status & Opening */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Stockfish 10 Engine</span>
            {evaluation && (
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-sm font-mono">
                Depth {evaluation.depth}
              </span>
            )}
          </div>

          <button
            onClick={onToggleArrow}
            className={`text-xs px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showBestMoveArrow
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Toggle Best Move Arrow on Board"
          >
            {showBestMoveArrow ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{showBestMoveArrow ? "Arrow ON" : "Arrow OFF"}</span>
          </button>
        </div>

        {/* Opening Name */}
        {opening && (
          <div className="flex items-center gap-1.5 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-md px-2.5 py-1 mt-1">
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold text-amber-200">{opening.eco}</span>
            <span className="truncate">{opening.name}</span>
          </div>
        )}
      </div>

      {/* Real-Time Engine Recommendation Card */}
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-800">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Win Rate Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Win Chance
              </span>
              <span className="font-mono text-zinc-200 font-bold">
                {evaluation ? `${evaluation.winChance}%` : "50%"}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400 transition-all duration-300"
                style={{ width: `${evaluation ? evaluation.winChance : 50}%` }}
                title="White win probability"
              />
              <div
                className="bg-zinc-600 transition-all duration-300"
                style={{ width: `${evaluation ? 100 - evaluation.winChance : 50}%` }}
                title="Black win probability"
              />
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 mt-1 font-mono">
              <span>White {evaluation ? evaluation.winChance : 50}%</span>
              <span>Black {evaluation ? 100 - evaluation.winChance : 50}%</span>
            </div>
          </div>

          {/* Best Move Recommendation Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Move</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-black text-emerald-400 font-mono tracking-wide flex items-center gap-1">
                <ArrowRight className="w-4 h-4 text-emerald-400" />
                {evaluation?.bestMoveSan || evaluation?.bestMoveUci || "..."}
              </span>
              <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded-sm">
                {evaluation?.formattedScore || "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* Move Quality Feedback Banner */}
        {lastMoveQuality && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">Last Move Rating:</span>
            {(() => {
              const b = getQualityBadge(lastMoveQuality);
              return (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${b.color}`}>
                  <span className="font-mono text-[10px]">{b.icon}</span>
                  {b.label}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Move History Table */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 bg-zinc-950/20 text-xs font-semibold text-zinc-400 border-b border-zinc-800/60 flex items-center justify-between">
          <span>Notation History</span>
          <span className="text-[10px] text-zinc-500">{moves.length} moves</span>
        </div>

        <div ref={moveListRef} className="flex-1 overflow-y-auto p-2 divide-y divide-zinc-800/30 text-xs font-mono">
          {movePairs.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-xs font-sans">
              Play or move pieces on the board to start analysis
            </div>
          ) : (
            movePairs.map((pair) => (
              <div key={pair.number} className="flex items-center py-1 px-2 hover:bg-zinc-800/40 rounded-sm">
                <span className="w-10 text-zinc-500 select-none">{pair.number}.</span>

                {/* White move */}
                <button
                  onClick={() => onJumpToMove(pair.whiteIdx)}
                  className={`flex-1 text-left px-2 py-1 rounded-sm cursor-pointer transition-colors ${
                    currentMoveIndex === pair.whiteIdx
                      ? "bg-emerald-500/20 text-emerald-300 font-bold"
                      : "text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  {pair.white?.san}
                </button>

                {/* Black move */}
                {pair.black ? (
                  <button
                    onClick={() => onJumpToMove(pair.blackIdx)}
                    className={`flex-1 text-left px-2 py-1 rounded-sm cursor-pointer transition-colors ${
                      currentMoveIndex === pair.blackIdx
                        ? "bg-emerald-500/20 text-emerald-300 font-bold"
                        : "text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    {pair.black.san}
                  </button>
                ) : (
                  <span className="flex-1" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Move Navigation Controls */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onJumpToMove(-1)}
              disabled={currentMoveIndex === -1}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Start of game"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onJumpToMove(Math.max(-1, currentMoveIndex - 1))}
              disabled={currentMoveIndex === -1}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Previous move"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onJumpToMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
              disabled={currentMoveIndex >= moves.length - 1}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Next move"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onJumpToMove(moves.length - 1)}
              disabled={currentMoveIndex >= moves.length - 1}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              title="Latest move"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          {/* Copy FEN button */}
          <button
            onClick={copyFen}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="Copy FEN to clipboard"
          >
            {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedFen ? "Copied" : "Copy FEN"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
