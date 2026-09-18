"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Move, Square } from "chess.js";
import confetti from "canvas-confetti";
import {
  StockfishEngine,
  EngineEvaluation,
  MoveQuality,
  evaluateMoveQuality,
  UserMoveCategory,
  EvaluatedMove,
  GameReviewStats,
  evaluate6TierMoveQuality,
  buildGameReviewStats,
} from "@/lib/chess/engine";
import { findOpening, ChessOpening } from "@/lib/chess/openings";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { EvalBar } from "@/components/chess/EvalBar";
import { AnalysisPanel } from "@/components/chess/AnalysisPanel";
import { GameControls, GameMode, BotDifficulty } from "@/components/chess/GameControls";
import { SavedGamesModal } from "@/components/chess/SavedGamesModal";
import { ChesscomImportModal, ChesscomGameItem } from "@/components/chess/ChesscomImportModal";
import { GameReviewScorecard } from "@/components/chess/GameReviewScorecard";
import { MoveSticker, CHESSCOM_STICKER_CONFIG } from "@/components/chess/MoveSticker";
import { soundManager } from "@/lib/audio/sounds";
import { supabase } from "@/lib/supabase/client";
import {
  Flame,
  Database,
  ShieldCheck,
  Trophy,
  Sparkles,
  Undo2,
  RotateCcw,
  Repeat,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Tag,
  GitBranch,
} from "lucide-react";

export default function Home() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [flipped, setFlipped] = useState<boolean>(false);

  // Engine state
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [showStickers, setShowStickers] = useState<boolean>(true);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);
  const [last6TierCategory, setLast6TierCategory] = useState<UserMoveCategory | null>(null);
  const [opening, setOpening] = useState<ChessOpening | null>(null);

  // 6-Tier Move Quality & Full Game Review State
  const [evaluatedMoves, setEvaluatedMoves] = useState<EvaluatedMove[]>([]);
  const [gameReviewStats, setGameReviewStats] = useState<GameReviewStats | null>(null);
  const [isChesscomModalOpen, setIsChesscomModalOpen] = useState<boolean>(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState<boolean>(false);
  const [isAnalyzingFullGame, setIsAnalyzingFullGame] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [gamePlayers, setGamePlayers] = useState<{
    white: { username: string; rating?: number | string };
    black: { username: string; rating?: number | string };
  }>({
    white: { username: "White" },
    black: { username: "Black" },
  });

  // Review Main Line & Deviation (Branching) State
  const [reviewMainLineMoves, setReviewMainLineMoves] = useState<Move[]>([]);
  const [reviewMainLineEvaluations, setReviewMainLineEvaluations] = useState<EvaluatedMove[]>([]);
  const [isDeviatedFromReview, setIsDeviatedFromReview] = useState<boolean>(false);
  const [deviationBranchIndex, setDeviationBranchIndex] = useState<number>(-1);

  // Game mode
  const [gameMode, setGameMode] = useState<GameMode>("analysis");
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>("medium");
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  // Modal
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);

  const engineRef = useRef<StockfishEngine | null>(null);
  const prevWinChanceRef = useRef<number>(50);

  // Initialize engine on mount
  useEffect(() => {
    const engine = new StockfishEngine();
    engineRef.current = engine;

    // Initial analysis of starting position
    engine.analyzePosition(game.fen(), 14, (evalData) => {
      setEvaluation(evalData);
      prevWinChanceRef.current = evalData.winChance;
    });

    return () => {
      engine.terminate();
    };
  }, []);

  // Update opening whenever moves change
  useEffect(() => {
    const sanList = moves.slice(0, currentMoveIndex + 1).map((m) => m.san);
    const matched = findOpening(sanList);
    setOpening(matched);
  }, [moves, currentMoveIndex]);

  // Request engine analysis when position changes
  const runAnalysis = useCallback((fen: string, depth = 14) => {
    if (!engineRef.current) return;
    engineRef.current.analyzePosition(fen, depth, (evalData) => {
      setEvaluation(evalData);
    });
  }, []);

  // Refs to avoid stale closures and prevent evaluation stream from cancelling bot timer
  const evaluationRef = useRef<EngineEvaluation | null>(null);
  evaluationRef.current = evaluation;

  const gameRef = useRef<Chess>(game);
  gameRef.current = game;

  const movesRef = useRef<Move[]>(moves);
  movesRef.current = moves;

  const currentMoveIndexRef = useRef<number>(currentMoveIndex);
  currentMoveIndexRef.current = currentMoveIndex;

  const evaluatedMovesRef = useRef<EvaluatedMove[]>(evaluatedMoves);
  evaluatedMovesRef.current = evaluatedMoves;

  const reviewMainLineMovesRef = useRef<Move[]>(reviewMainLineMoves);
  reviewMainLineMovesRef.current = reviewMainLineMoves;

  const reviewMainLineEvaluationsRef = useRef<EvaluatedMove[]>(reviewMainLineEvaluations);
  reviewMainLineEvaluationsRef.current = reviewMainLineEvaluations;

  const isDeviatedFromReviewRef = useRef<boolean>(isDeviatedFromReview);
  isDeviatedFromReviewRef.current = isDeviatedFromReview;

  const deviationBranchIndexRef = useRef<number>(deviationBranchIndex);
  deviationBranchIndexRef.current = deviationBranchIndex;

  // Handle user or bot move
  const handleMoveMade = (move: Move, newGame: Chess) => {
    const prevChance = prevWinChanceRef.current;
    const movedColor = newGame.turn() === "w" ? "b" : "w"; // Player who just made the move
    const prevEvaluated = evaluatedMovesRef.current;
    const prevMove = prevEvaluated.length > 0 ? prevEvaluated[prevEvaluated.length - 1] : null;
    const isOpponentError = prevMove
      ? prevMove.category === "mistake" || prevMove.category === "blunder"
      : false;

    // Check if we are currently reviewing a loaded game
    const hasReviewGame = reviewMainLineMovesRef.current.length > 0;
    const currentIdx = currentMoveIndexRef.current;

    if (hasReviewGame) {
      const nextExpectedMove = reviewMainLineMovesRef.current[currentIdx + 1];

      if (!isDeviatedFromReviewRef.current) {
        // Did the user play the move that actually occurred in the reviewed game?
        const isSameMove =
          nextExpectedMove &&
          nextExpectedMove.from === move.from &&
          nextExpectedMove.to === move.to &&
          (!nextExpectedMove.promotion || nextExpectedMove.promotion === move.promotion);

        if (isSameMove) {
          // User played the exact move from the review! Advance along main line.
          setGame(newGame);
          const nextIdx = currentIdx + 1;
          setCurrentMoveIndex(nextIdx);

          // If already pre-evaluated from full review, display its quality and sticker immediately
          const preEvaluated = reviewMainLineEvaluationsRef.current[nextIdx];
          if (preEvaluated) {
            setLast6TierCategory(preEvaluated.category);
            setLastMoveQuality(
              evaluateMoveQuality(
                preEvaluated.winChanceBefore,
                preEvaluated.winChanceAfter,
                movedColor
              )
            );
          }

          if (engineRef.current) {
            engineRef.current.analyzePosition(newGame.fen(), 14, (evalData) => {
              setEvaluation(evalData);
              prevWinChanceRef.current = evalData.winChance;
            });
          }
          return;
        } else {
          // User played a DIFFERENT move! Enter Deviation / Alternate Line exploration
          setIsDeviatedFromReview(true);
          isDeviatedFromReviewRef.current = true;
          setDeviationBranchIndex(currentIdx);
          deviationBranchIndexRef.current = currentIdx;
        }
      }
    }

    // Update game state for normal move or deviation move
    setGame(newGame);
    const newMoves = [...movesRef.current.slice(0, currentMoveIndexRef.current + 1), move];
    setMoves(newMoves);
    const newMoveIdx = newMoves.length - 1;
    setCurrentMoveIndex(newMoveIdx);

    // Run engine analysis on new position
    if (engineRef.current) {
      engineRef.current.analyzePosition(newGame.fen(), 14, (evalData) => {
        setEvaluation(evalData);

        // 4-tier legacy quality
        const quality = evaluateMoveQuality(prevChance, evalData.winChance, movedColor);
        setLastMoveQuality(quality);

        // 6-tier user quality: excellent, very good, good, mistake, miss, blunder
        const sixTier = evaluate6TierMoveQuality(
          prevChance,
          evalData.winChance,
          movedColor,
          isOpponentError
        );
        setLast6TierCategory(sixTier);

        const newEvaluatedMove: EvaluatedMove = {
          index: newMoveIdx,
          san: move.san,
          from: move.from,
          to: move.to,
          color: movedColor,
          category: sixTier,
          winChanceBefore: prevChance,
          winChanceAfter: evalData.winChance,
          bestMoveSan: evalData.bestMoveSan,
          bestMoveUci: evalData.bestMoveUci,
          evalScore: evalData.formattedScore,
        };

        setEvaluatedMoves((prev) => {
          const updated = [...prev.slice(0, newMoveIdx), newEvaluatedMove];
          setGameReviewStats(buildGameReviewStats(updated));
          return updated;
        });

        prevWinChanceRef.current = evalData.winChance;
      });
    }

    // Check for game over (Checkmate celebration)
    if (newGame.isGameOver()) {
      if (newGame.isCheckmate()) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Bot response effect
  useEffect(() => {
    if (gameMode === "analysis" || game.isGameOver()) {
      setIsBotThinking(false);
      return;
    }

    const isBotTurn =
      (gameMode === "play_white" && game.turn() === "b") ||
      (gameMode === "play_black" && game.turn() === "w");

    if (!isBotTurn) {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);

    const timer = setTimeout(() => {
      const currentGame = gameRef.current;
      if (currentGame.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      const legalMoves = currentGame.moves({ verbose: true });
      if (legalMoves.length === 0) {
        setIsBotThinking(false);
        return;
      }

      // Pick best move or alternative depending on difficulty
      const bestUci = evaluationRef.current?.bestMoveUci;
      const bestLegalMove = bestUci && bestUci.length >= 4
        ? legalMoves.find(
            (m) =>
              m.from === bestUci.slice(0, 2) &&
              m.to === bestUci.slice(2, 4) &&
              (!m.promotion || m.promotion === (bestUci.slice(4, 5) || "q"))
          )
        : null;

      let chosenMove: Move | null = null;
      const rand = Math.random();

      if (botDifficulty === "hard") {
        chosenMove = bestLegalMove || legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else if (botDifficulty === "medium") {
        chosenMove = rand < 0.75 && bestLegalMove
          ? bestLegalMove
          : legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        // Easy
        chosenMove = rand < 0.35 && bestLegalMove
          ? bestLegalMove
          : legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }

      if (chosenMove) {
        const clone = new Chess(currentGame.fen());
        const executed = clone.move(chosenMove);
        if (executed) {
          if (clone.isGameOver()) {
            soundManager.playVictory();
          } else if (clone.inCheck()) {
            soundManager.playCheck();
          } else if (executed.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }
          handleMoveMade(executed, clone);
        }
      }
      setIsBotThinking(false);
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [game, gameMode, botDifficulty]);

  // Full game review batch analysis
  const startFullGameAnalysis = async (customMoves?: Move[]) => {
    const movesToAnalyze = customMoves || movesRef.current;
    if (movesToAnalyze.length === 0 || !engineRef.current) return;

    setIsAnalyzingFullGame(true);
    setAnalysisProgress(0);

    const tempGame = new Chess();
    const evaluated: EvaluatedMove[] = [];
    let currentWinChance = 50;

    // Initial position evaluation
    try {
      const initialEval = await engineRef.current.evaluatePositionAsync(tempGame.fen(), 8);
      currentWinChance = initialEval.winChance;
    } catch {
      currentWinChance = 50;
    }

    for (let i = 0; i < movesToAnalyze.length; i++) {
      const m = movesToAnalyze[i];
      const movedColor: "w" | "b" = tempGame.turn();
      const prevMove = evaluated.length > 0 ? evaluated[evaluated.length - 1] : null;
      const isOpponentError = prevMove
        ? prevMove.category === "mistake" || prevMove.category === "blunder"
        : false;

      tempGame.move(m);
      const nextFen = tempGame.fen();

      // Quick depth 8 analysis for fast game review (30-50ms per move)
      const nextEval = await engineRef.current.evaluatePositionAsync(nextFen, 8);
      const newWinChance = nextEval.winChance;

      const category = evaluate6TierMoveQuality(
        currentWinChance,
        newWinChance,
        movedColor,
        isOpponentError
      );

      evaluated.push({
        index: i,
        san: m.san,
        from: m.from,
        to: m.to,
        color: movedColor,
        category,
        winChanceBefore: currentWinChance,
        winChanceAfter: newWinChance,
        bestMoveSan: nextEval.bestMoveSan,
        bestMoveUci: nextEval.bestMoveUci,
        evalScore: nextEval.formattedScore,
      });

      currentWinChance = newWinChance;
      setAnalysisProgress(Math.round(((i + 1) / movesToAnalyze.length) * 100));
    }

    setEvaluatedMoves(evaluated);
    setReviewMainLineEvaluations(evaluated);
    reviewMainLineEvaluationsRef.current = evaluated;
    const stats = buildGameReviewStats(evaluated);
    setGameReviewStats(stats);
    setIsAnalyzingFullGame(false);
  };

  // Return to original review from deviation (Alternate line)
  const handleReturnToReview = () => {
    const mainMoves = reviewMainLineMovesRef.current;
    const branchIdx = deviationBranchIndexRef.current;

    setIsDeviatedFromReview(false);
    isDeviatedFromReviewRef.current = false;
    setDeviationBranchIndex(-1);
    deviationBranchIndexRef.current = -1;

    setMoves(mainMoves);
    movesRef.current = mainMoves;

    const mainEvals = reviewMainLineEvaluationsRef.current;
    if (mainEvals.length > 0) {
      setEvaluatedMoves(mainEvals);
      evaluatedMovesRef.current = mainEvals;
      setGameReviewStats(buildGameReviewStats(mainEvals));
    }

    const targetIdx = branchIdx;
    const newGame = new Chess();
    for (let i = 0; i <= targetIdx; i++) {
      if (mainMoves[i]) {
        newGame.move(mainMoves[i]);
      }
    }
    setGame(newGame);
    setCurrentMoveIndex(targetIdx);
    currentMoveIndexRef.current = targetIdx;

    if (targetIdx >= 0 && mainEvals[targetIdx]) {
      setLast6TierCategory(mainEvals[targetIdx].category);
    } else {
      setLast6TierCategory(null);
    }

    runAnalysis(newGame.fen());
  };

  // Jump to specific move in history
  const handleJumpToMove = (index: number) => {
    setCurrentMoveIndex(index);
    currentMoveIndexRef.current = index;
    const currentMoves = movesRef.current;

    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      if (currentMoves[i]) {
        newGame.move(currentMoves[i]);
      }
    }
    setGame(newGame);
    const evals = evaluatedMovesRef.current;
    if (index >= 0 && evals[index]) {
      setLast6TierCategory(evals[index].category);
      setLastMoveQuality(
        evaluateMoveQuality(
          evals[index].winChanceBefore,
          evals[index].winChanceAfter,
          evals[index].color
        )
      );
    } else {
      setLast6TierCategory(null);
      setLastMoveQuality(null);
    }
    runAnalysis(newGame.fen());
  };

  // New Game
  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoves([]);
    movesRef.current = [];
    setCurrentMoveIndex(-1);
    currentMoveIndexRef.current = -1;
    setLastMoveQuality(null);
    setLast6TierCategory(null);
    setEvaluatedMoves([]);
    evaluatedMovesRef.current = [];
    setGameReviewStats(null);
    setReviewMainLineMoves([]);
    reviewMainLineMovesRef.current = [];
    setReviewMainLineEvaluations([]);
    reviewMainLineEvaluationsRef.current = [];
    setIsDeviatedFromReview(false);
    isDeviatedFromReviewRef.current = false;
    setDeviationBranchIndex(-1);
    deviationBranchIndexRef.current = -1;
    setGamePlayers({
      white: { username: "White" },
      black: { username: "Black" },
    });
    setOpening(null);
    prevWinChanceRef.current = 50;
    runAnalysis(newGame.fen());
  };

  // Undo move
  const handleUndoMove = () => {
    if (moves.length === 0) return;
    if (isDeviatedFromReviewRef.current) {
      const targetIdx = currentMoveIndex - 1;
      if (targetIdx <= deviationBranchIndexRef.current) {
        handleReturnToReview();
        return;
      }
    }
    const countToUndo = gameMode === "analysis" ? 1 : 2; // In bot mode, undo bot move + player move
    const targetIdx = Math.max(-1, currentMoveIndex - countToUndo);
    handleJumpToMove(targetIdx);
    setMoves((prev) => prev.slice(0, targetIdx + 1));
    movesRef.current = movesRef.current.slice(0, targetIdx + 1);
    setEvaluatedMoves((prev) => {
      const updated = prev.slice(0, targetIdx + 1);
      evaluatedMovesRef.current = updated;
      setGameReviewStats(buildGameReviewStats(updated));
      return updated;
    });
  };

  // Import FEN
  const handleImportFen = (fen: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMoveQuality(null);
      setLast6TierCategory(null);
      setEvaluatedMoves([]);
      setGameReviewStats(null);
      runAnalysis(newGame.fen());
    } catch (e) {
      alert("Invalid FEN string format.");
    }
  };

  // Import PGN
  const handleImportPgn = (pgn: string) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      const history = newGame.history({ verbose: true });
      const headers = newGame.header();
      setGamePlayers({
        white: { username: headers["White"] || "White", rating: headers["WhiteElo"] || "" },
        black: { username: headers["Black"] || "Black", rating: headers["BlackElo"] || "" },
      });
      setGame(newGame);
      setMoves(history);
      setCurrentMoveIndex(history.length - 1);
      setLastMoveQuality(null);
      setLast6TierCategory(null);
      setEvaluatedMoves([]);
      setGameReviewStats(null);
      runAnalysis(newGame.fen());
    } catch (e) {
      alert("Invalid PGN format.");
    }
  };

  // Chess.com 대국 선택 시 자동 로드 및 전체 복기 시작
  const handleSelectChesscomGame = async (
    gameItem: ChesscomGameItem,
    userColor?: "white" | "black"
  ) => {
    try {
      const fullGame = new Chess();
      fullGame.loadPgn(gameItem.pgn);
      const history = fullGame.history({ verbose: true });

      setGamePlayers({
        white: { username: gameItem.white.username, rating: gameItem.white.rating },
        black: { username: gameItem.black.username, rating: gameItem.black.rating },
      });

      // 1. 색상 일치: 사용자 플레이어 색상에 맞추어 보드 방향 자동 설정
      if (userColor === "black") {
        setFlipped(true);
      } else if (userColor === "white") {
        setFlipped(false);
      }

      // 2. 아예 움직이지 않은 0수 처음 화면으로 시작
      const startBoard = new Chess();
      setGame(startBoard);
      setMoves(history);
      movesRef.current = history;
      setCurrentMoveIndex(-1);
      currentMoveIndexRef.current = -1;

      // 3. 복기 메인 수순 저장 및 분기 상태 초기화
      setReviewMainLineMoves(history);
      reviewMainLineMovesRef.current = history;
      setIsDeviatedFromReview(false);
      isDeviatedFromReviewRef.current = false;
      setDeviationBranchIndex(-1);
      deviationBranchIndexRef.current = -1;

      setLastMoveQuality(null);
      setLast6TierCategory(null);
      setEvaluatedMoves([]);
      evaluatedMovesRef.current = [];
      setGameReviewStats(null);
      setIsChesscomModalOpen(false);
      setGameMode("analysis");
      runAnalysis(startBoard.fen());

      // 복기 모달 열고 자동 전체 분석 시작
      setIsScorecardOpen(true);
      await startFullGameAnalysis(history);
    } catch (e) {
      alert("대국 기보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 직접 PGN 입력으로 복기 시작
  const handleDirectPgnImport = async (pgn: string) => {
    try {
      const fullGame = new Chess();
      fullGame.loadPgn(pgn);
      const history = fullGame.history({ verbose: true });
      const headers = fullGame.header();

      setGamePlayers({
        white: { username: headers["White"] || "White", rating: headers["WhiteElo"] || "" },
        black: { username: headers["Black"] || "Black", rating: headers["BlackElo"] || "" },
      });

      const startBoard = new Chess();
      setGame(startBoard);
      setMoves(history);
      movesRef.current = history;
      setCurrentMoveIndex(-1);
      currentMoveIndexRef.current = -1;

      setReviewMainLineMoves(history);
      reviewMainLineMovesRef.current = history;
      setIsDeviatedFromReview(false);
      isDeviatedFromReviewRef.current = false;
      setDeviationBranchIndex(-1);
      deviationBranchIndexRef.current = -1;

      setLastMoveQuality(null);
      setLast6TierCategory(null);
      setEvaluatedMoves([]);
      evaluatedMovesRef.current = [];
      setGameReviewStats(null);
      setIsChesscomModalOpen(false);
      setGameMode("analysis");
      runAnalysis(startBoard.fen());

      setIsScorecardOpen(true);
      await startFullGameAnalysis(history);
    } catch (e) {
      alert("PGN 형식이 올바르지 않습니다.");
    }
  };

  // Load from Supabase saved game
  const handleLoadSaved = (fen: string, pgn: string) => {
    if (pgn) {
      handleImportPgn(pgn);
    } else {
      handleImportFen(fen);
    }
  };

  // Active move & Chess.com sticker on board
  const activeMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null;
  const activeEvaluated = currentMoveIndex >= 0 ? evaluatedMoves[currentMoveIndex] : null;
  const currentStickerCategory =
    activeEvaluated?.category ||
    (currentMoveIndex === moves.length - 1 ? last6TierCategory : null);
  const currentStickerSquare = activeMove ? (activeMove.to as Square) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            ♞
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                ChessPulse <span className="text-emerald-400 text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30">AI</span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Real-time Best Move & Win Rate Analysis • Chess.com Style Study
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Chess.com Import Button */}
          <button
            onClick={() => setIsChesscomModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#769656] hover:bg-[#68854b] text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            title="Chess.com 대국 불러오기 및 복기"
          >
            <span>♟</span>
            <span>Chess.com 복기</span>
          </button>

          {/* Review Scorecard Button (Visible when moves are evaluated) */}
          {evaluatedMoves.length > 0 && (
            <button
              onClick={() => setIsScorecardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
              title="대국 복기 통계표 보기"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">복기 통계표</span>
              <span className="sm:hidden">통계</span>
              <span className="bg-cyan-900/60 text-cyan-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {evaluatedMoves.length}
              </span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 bg-zinc-800/60 border border-zinc-700/50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Stockfish 10 WASM</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] ${
              supabase
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800/60 border-zinc-700/50 text-zinc-400"
            }`}
            title={supabase ? "Connected to Supabase" : "Using Local Storage (Supabase ready)"}
          >
            <Database className="w-3 h-3" />
            <span>{supabase ? "Supabase Connected" : "Local / Supabase Ready"}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left / Center: Eval Bar + Chessboard */}
        <div className="w-full lg:w-auto flex flex-col items-center">
          <div className="flex gap-3 sm:gap-4 w-full max-w-[580px] justify-center items-stretch">
            {/* Real-time Vertical Evaluation Bar */}
            <EvalBar
              winChance={evaluation?.winChance ?? 50}
              formattedScore={evaluation?.formattedScore ?? "0.0"}
              flipped={flipped}
            />

            {/* Main Interactive Chessboard */}
            <div className="flex-1 min-w-0">
              <ChessBoard
                game={game}
                flipped={flipped}
                bestMoveUci={evaluation?.bestMoveUci}
                showBestMoveArrow={showBestMoveArrow}
                onMoveMade={handleMoveMade}
                disabled={isBotThinking}
                lastMoveCategory={currentStickerCategory}
                lastMoveToSquare={currentStickerSquare}
                showStickers={showStickers}
              />
            </div>
          </div>

          {/* Deviation / Alternate Line Alert Banner under Chessboard */}
          {isDeviatedFromReview && (
            <div className="w-full max-w-[580px] mt-2 px-3.5 py-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <GitBranch className="w-4 h-4 text-amber-400 shrink-0" />
                <span>대국과 다른 수순(분기) 분석 중입니다</span>
              </div>
              <button
                onClick={handleReturnToReview}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                title="원래 복기 수순으로 돌아가기"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>원래 복기로 복귀</span>
              </button>
            </div>
          )}

          {/* Quick Under-Board Control Bar (Mobile & Fast Study Optimized) */}
          <div className="w-full max-w-[580px] mt-3 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg flex flex-col gap-2.5">
            {/* Primary Action Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Prominent Take Back Button */}
              <button
                onClick={handleUndoMove}
                disabled={moves.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-950/40 disabled:opacity-30 disabled:hover:bg-emerald-600 disabled:active:scale-100 transition-all cursor-pointer"
                title="한 수 되돌리기 (Take Back)"
              >
                <Undo2 className="w-4 h-4 shrink-0" />
                <span>Take Back (무르기)</span>
              </button>

              {/* Step Navigation (< >) */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => handleJumpToMove(Math.max(-1, currentMoveIndex - 1))}
                  disabled={currentMoveIndex === -1}
                  className="p-2 rounded-md hover:bg-zinc-800 text-zinc-300 disabled:opacity-25 cursor-pointer transition-colors"
                  title="이전 수 보기"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleJumpToMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
                  disabled={currentMoveIndex >= moves.length - 1}
                  className="p-2 rounded-md hover:bg-zinc-800 text-zinc-300 disabled:opacity-25 cursor-pointer transition-colors"
                  title="다음 수 보기"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Sticker Toggle Button */}
              <button
                onClick={() => setShowStickers(!showStickers)}
                className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  showStickers
                    ? "bg-zinc-800 text-cyan-300 border-cyan-500/40 shadow-xs"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
                title={showStickers ? "체스닷컴 스티커 숨기기" : "체스닷컴 스티커 켜기"}
              >
                <Tag className="w-4 h-4" />
              </button>

              {/* Flip Board */}
              <button
                onClick={() => setFlipped(!flipped)}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
                title="보드 회전 (Flip Board)"
              >
                <Repeat className="w-4 h-4" />
              </button>

              {/* New Game */}
              <button
                onClick={handleNewGame}
                className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
                title="새 게임 시작 (New Game)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Live Best Move Hint */}
            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    game.turn() === "w" ? "bg-white border border-zinc-600 shadow-xs" : "bg-zinc-900 border border-zinc-500"
                  }`}
                />
                <span className="font-semibold text-zinc-200">
                  {game.turn() === "w" ? "White 차례" : "Black 차례"}
                </span>
                {isBotThinking && (
                  <span className="text-emerald-400 animate-pulse text-[11px] font-medium">(봇 생각 중...)</span>
                )}

                {/* Active Move Chess.com Sticker Hint */}
                {showStickers && currentStickerCategory && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800 animate-in fade-in duration-150">
                    <MoveSticker category={currentStickerCategory} size="xs" />
                    <span className="font-bold text-zinc-200 capitalize text-[11px]">
                      {CHESSCOM_STICKER_CONFIG[currentStickerCategory].label}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      ({CHESSCOM_STICKER_CONFIG[currentStickerCategory].labelKo})
                    </span>
                  </div>
                )}
              </div>

              <div>
                {game.isGameOver() ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    {game.isCheckmate()
                      ? `체크메이트! ${game.turn() === "w" ? "Black" : "White"} 승리`
                      : game.isDraw()
                      ? "무승부!"
                      : "게임 종료"}
                  </span>
                ) : (
                  evaluation && (
                    <span className="text-zinc-400 font-mono text-[11px]">
                      추천 수: <strong className="text-emerald-400 font-bold">{evaluation.bestMoveSan || evaluation.bestMoveUci}</strong> ({evaluation.formattedScore})
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Panel & Controls */}
        <div className="w-full lg:w-[460px] flex flex-col gap-4">
          {/* Analysis & Move History Panel */}
          <div className="h-[460px] sm:h-[480px]">
            <AnalysisPanel
              evaluation={evaluation}
              lastMoveQuality={lastMoveQuality}
              last6TierCategory={last6TierCategory}
              evaluatedMoves={evaluatedMoves}
              onOpenScorecard={() => setIsScorecardOpen(true)}
              opening={opening}
              moves={moves}
              currentMoveIndex={currentMoveIndex}
              onJumpToMove={handleJumpToMove}
              showBestMoveArrow={showBestMoveArrow}
              onToggleArrow={() => setShowBestMoveArrow(!showBestMoveArrow)}
              showStickers={showStickers}
              onToggleStickers={() => setShowStickers(!showStickers)}
              isDeviatedFromReview={isDeviatedFromReview}
              onReturnToReview={handleReturnToReview}
              fen={game.fen()}
            />
          </div>

          {/* Game Controls & Mode Selectors */}
          <GameControls
            mode={gameMode}
            onChangeMode={(newMode) => {
              setGameMode(newMode);
              if (newMode === "play_black") {
                setFlipped(true);
              } else if (newMode === "play_white") {
                setFlipped(false);
              }
            }}
            botDifficulty={botDifficulty}
            onChangeDifficulty={setBotDifficulty}
            onNewGame={handleNewGame}
            onFlipBoard={() => setFlipped(!flipped)}
            onUndoMove={handleUndoMove}
            onOpenSavedModal={() => setIsSavedModalOpen(true)}
            onOpenChesscomModal={() => setIsChesscomModalOpen(true)}
            onOpenScorecard={() => setIsScorecardOpen(true)}
            onImportFen={handleImportFen}
            onImportPgn={handleImportPgn}
            currentFen={game.fen()}
            currentPgn={game.pgn()}
            movesCount={moves.length}
            evalSummary={evaluation?.formattedScore ?? "0.0"}
          />
        </div>
      </main>

      {/* Chess.com Import Modal */}
      <ChesscomImportModal
        isOpen={isChesscomModalOpen}
        onClose={() => setIsChesscomModalOpen(false)}
        onSelectGame={handleSelectChesscomGame}
        onDirectPgnImport={handleDirectPgnImport}
      />

      {/* Game Review Scorecard Modal */}
      <GameReviewScorecard
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        stats={gameReviewStats}
        whiteName={gamePlayers.white.username}
        blackName={gamePlayers.black.username}
        whiteRating={gamePlayers.white.rating}
        blackRating={gamePlayers.black.rating}
        onJumpToMove={(idx) => {
          if (isDeviatedFromReviewRef.current) {
            handleReturnToReview();
          }
          handleJumpToMove(idx);
        }}
        isAnalyzingFullGame={isAnalyzingFullGame}
        analysisProgress={analysisProgress}
        onStartFullAnalysis={() => startFullGameAnalysis()}
        totalMovesCount={moves.length}
      />

      {/* Supabase Saved Games Modal */}
      <SavedGamesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadGame={handleLoadSaved}
      />
    </div>
  );
}
