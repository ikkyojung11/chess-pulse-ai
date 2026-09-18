// Chess.com Style Game Review Scorecard Modal
import React, { useState } from "react";
import { UserMoveCategory, GameReviewStats, EvaluatedMove } from "@/lib/chess/engine";
import {
  X,
  Sparkles,
  Trophy,
  BarChart3,
  CheckCircle2,
  ThumbsUp,
  Minus,
  AlertTriangle,
  HelpCircle,
  AlertOctagon,
  ArrowRight,
  Play,
  Filter,
} from "lucide-react";

interface GameReviewScorecardProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameReviewStats | null;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number | string;
  blackRating?: number | string;
  onJumpToMove: (index: number) => void;
  isAnalyzingFullGame: boolean;
  analysisProgress: number; // 0 to 100
  onStartFullAnalysis: () => void;
  totalMovesCount: number;
}

export const CATEGORY_CONFIG: Record<
  UserMoveCategory,
  {
    label: string;
    labelKo: string;
    icon: string;
    badgeColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  excellent: {
    label: "Excellent",
    labelKo: "훌륭한 수",
    icon: "★",
    badgeColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/40",
  },
  "very good": {
    label: "Very Good",
    labelKo: "매우 좋은 수",
    icon: "✓✓",
    badgeColor: "bg-cyan-500/20",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-500/40",
  },
  good: {
    label: "Good",
    labelKo: "좋은 수",
    icon: "✓",
    badgeColor: "bg-sky-500/20",
    textColor: "text-sky-300",
    borderColor: "border-sky-500/40",
  },
  mistake: {
    label: "Mistake",
    labelKo: "실수",
    icon: "?!",
    badgeColor: "bg-amber-500/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/40",
  },
  miss: {
    label: "Miss",
    labelKo: "놓친 기회",
    icon: "⊘",
    badgeColor: "bg-fuchsia-500/20",
    textColor: "text-fuchsia-300",
    borderColor: "border-fuchsia-500/40",
  },
  blunder: {
    label: "Blunder",
    labelKo: "블런더 (치명적 실수)",
    icon: "??",
    badgeColor: "bg-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/40",
  },
};

export const GameReviewScorecard: React.FC<GameReviewScorecardProps> = ({
  isOpen,
  onClose,
  stats,
  whiteName = "White",
  blackName = "Black",
  whiteRating,
  blackRating,
  onJumpToMove,
  isAnalyzingFullGame,
  analysisProgress,
  onStartFullAnalysis,
  totalMovesCount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<UserMoveCategory | "all">("all");
  const [selectedColor, setSelectedColor] = useState<"all" | "w" | "b">("all");

  if (!isOpen) return null;

  const categories: UserMoveCategory[] = [
    "excellent",
    "very good",
    "good",
    "mistake",
    "miss",
    "blunder",
  ];

  const whiteCounts = stats?.whiteCounts || {
    excellent: 0,
    "very good": 0,
    good: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
  };

  const blackCounts = stats?.blackCounts || {
    excellent: 0,
    "very good": 0,
    good: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
  };

  const filteredMoves = (stats?.moves || []).filter((m) => {
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false;
    if (selectedColor !== "all" && m.color !== selectedColor) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Game Review Scorecard
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  6-Tier Analysis
                </span>
              </h2>
              <p className="text-xs text-zinc-400">나와 상대방의 수 품질 비교 및 복기 통계</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Analysis Banner if not yet analyzed */}
        {(!stats || stats.moves.length < totalMovesCount) && (
          <div className="p-3 bg-emerald-950/30 border-b border-emerald-800/40 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-300">
              {isAnalyzingFullGame ? (
                <div>
                  <span className="font-semibold text-emerald-400">
                    전체 대국 복기 분석 중... ({analysisProgress}%)
                  </span>
                  <div className="w-48 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-200"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span>
                  대국 전체({totalMovesCount}수)를 스톡피쉬로 일괄 분석하여 정밀 통계를 생성합니다.
                </span>
              )}
            </div>

            {!isAnalyzingFullGame && (
              <button
                onClick={onStartFullAnalysis}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>전체 분석 시작</span>
              </button>
            )}
          </div>
        )}

        {/* Players & Accuracy Comparison Cards */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-zinc-800 bg-zinc-950/30">
          {/* White Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-white border border-zinc-500 inline-block shrink-0" />
                <span className="text-xs font-bold text-white truncate">{whiteName}</span>
                {whiteRating && (
                  <span className="text-[10px] text-zinc-400 font-mono">({whiteRating})</span>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-zinc-400">Accuracy</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {stats ? `${stats.whiteAccuracy}%` : "--%"}
              </span>
            </div>
          </div>

          {/* Black Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-500 inline-block shrink-0" />
                <span className="text-xs font-bold text-white truncate">{blackName}</span>
                {blackRating && (
                  <span className="text-[10px] text-zinc-400 font-mono">({blackRating})</span>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-zinc-400">Accuracy</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {stats ? `${stats.blackAccuracy}%` : "--%"}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content: 6-Tier Comparison Table + Filtered Moves */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 6-Tier Move Quality Table */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
            <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80 bg-zinc-900/60">
              <span className="col-span-3 text-center">White ({whiteName})</span>
              <span className="col-span-6 text-center">수 품질 분류 (Category)</span>
              <span className="col-span-3 text-center">Black ({blackName})</span>
            </div>

            <div className="divide-y divide-zinc-800/40">
              {categories.map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const wCount = whiteCounts[cat] || 0;
                const bCount = blackCounts[cat] || 0;
                const isSelected = selectedCategory === cat;

                return (
                  <div
                    key={cat}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? "all" : cat)
                    }
                    className={`grid grid-cols-12 items-center px-3 py-2.5 hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                      isSelected ? "bg-zinc-800/60 ring-1 ring-inset ring-emerald-500/40" : ""
                    }`}
                  >
                    {/* White count */}
                    <div className="col-span-3 flex items-center justify-center font-mono font-bold text-sm text-zinc-200">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          wCount > 0 ? "bg-zinc-800 text-white" : "text-zinc-500"
                        }`}
                      >
                        {wCount}
                      </span>
                    </div>

                    {/* Category Label */}
                    <div className="col-span-6 flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-black px-1.5 py-0.2 rounded-sm border ${conf.badgeColor} ${conf.textColor} ${conf.borderColor}`}
                        >
                          {conf.icon}
                        </span>
                        <span className="text-xs font-bold text-zinc-100 capitalize">
                          {conf.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5">{conf.labelKo}</span>
                    </div>

                    {/* Black count */}
                    <div className="col-span-3 flex items-center justify-center font-mono font-bold text-sm text-zinc-200">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          bCount > 0 ? "bg-zinc-800 text-white" : "text-zinc-500"
                        }`}
                      >
                        {bCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Move Filter & Drill-down List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-300">
                  {selectedCategory === "all"
                    ? "분석된 전체 수"
                    : `${CATEGORY_CONFIG[selectedCategory].label} 수 목록`}
                </span>
                <span className="text-[11px] text-zinc-500">
                  ({filteredMoves.length}개)
                </span>
              </div>

              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                >
                  전체 보기
                </button>
              )}
            </div>

            {filteredMoves.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                해당 카테고리의 수가 없습니다.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {filteredMoves.map((m) => {
                  const conf = CATEGORY_CONFIG[m.category];
                  const moveNum = Math.floor(m.index / 2) + 1;
                  const isWhite = m.color === "w";

                  return (
                    <div
                      key={m.index}
                      onClick={() => {
                        onJumpToMove(m.index);
                        onClose();
                      }}
                      className="p-2 bg-zinc-950/40 hover:bg-zinc-800/60 border border-zinc-800/60 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500 w-8">
                          {moveNum}{isWhite ? "." : "..."}
                        </span>
                        <span className="text-xs font-bold text-white font-mono group-hover:text-emerald-300">
                          {m.san}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm border ${conf.badgeColor} ${conf.textColor} ${conf.borderColor}`}
                        >
                          {conf.icon} {conf.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        {m.bestMoveSan && m.category !== "excellent" && (
                          <span className="text-zinc-400 font-mono hidden sm:inline">
                            최선: <strong className="text-emerald-400">{m.bestMoveSan}</strong>
                          </span>
                        )}
                        <span className="text-zinc-400 font-mono">{m.evalScore}</span>
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
