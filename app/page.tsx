"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Move } from "chess.js";
import confetti from "canvas-confetti";
import { StockfishEngine, EngineEvaluation, MoveQuality, evaluateMoveQuality } from "@/lib/chess/engine";
import { findOpening, ChessOpening } from "@/lib/chess/openings";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { EvalBar } from "@/components/chess/EvalBar";
import { AnalysisPanel } from "@/components/chess/AnalysisPanel";
import { GameControls, GameMode, BotDifficulty } from "@/components/chess/GameControls";
import { SavedGamesModal } from "@/components/chess/SavedGamesModal";
import { soundManager } from "@/lib/audio/sounds";
import { supabase } from "@/lib/supabase/client";
import { Flame, Database, ShieldCheck, Trophy, Sparkles, Undo2, RotateCcw, Repeat, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [flipped, setFlipped] = useState<boolean>(false);

  // Engine state
  const [evaluation, setEvaluation] = useState<EngineEvaluation | null>(null);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);
  const [opening, setOpening] = useState<ChessOpening | null>(null);

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

  // Handle user or bot move
  const handleMoveMade = (move: Move, newGame: Chess) => {
    const prevChance = prevWinChanceRef.current;
    const movedColor = newGame.turn() === "w" ? "b" : "w"; // Player who just made the move

    // Update game state
    setGame(newGame);
    const newMoves = [...movesRef.current.slice(0, currentMoveIndexRef.current + 1), move];
    setMoves(newMoves);
    setCurrentMoveIndex(newMoves.length - 1);

    // Run engine analysis on new position
    if (engineRef.current) {
      engineRef.current.analyzePosition(newGame.fen(), 14, (evalData) => {
        setEvaluation(evalData);

        // Calculate move quality (Best, Good, Inaccuracy, Blunder)
        const quality = evaluateMoveQuality(prevChance, evalData.winChance, movedColor);
        setLastMoveQuality(quality);
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

  // Jump to specific move in history
  const handleJumpToMove = (index: number) => {
    setCurrentMoveIndex(index);
    const newGame = new Chess();
    for (let i = 0; i <= index; i++) {
      if (moves[i]) {
        newGame.move(moves[i]);
      }
    }
    setGame(newGame);
    runAnalysis(newGame.fen());
  };

  // New Game
  const handleNewGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoves([]);
    setCurrentMoveIndex(-1);
    setLastMoveQuality(null);
    setOpening(null);
    prevWinChanceRef.current = 50;
    runAnalysis(newGame.fen());
  };

  // Undo move
  const handleUndoMove = () => {
    if (moves.length === 0) return;
    const countToUndo = gameMode === "analysis" ? 1 : 2; // In bot mode, undo bot move + player move
    const targetIdx = Math.max(-1, currentMoveIndex - countToUndo);
    handleJumpToMove(targetIdx);
    setMoves((prev) => prev.slice(0, targetIdx + 1));
  };

  // Import FEN
  const handleImportFen = (fen: string) => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      setMoves([]);
      setCurrentMoveIndex(-1);
      setLastMoveQuality(null);
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
      setGame(newGame);
      setMoves(history);
      setCurrentMoveIndex(history.length - 1);
      setLastMoveQuality(null);
      runAnalysis(newGame.fen());
    } catch (e) {
      alert("Invalid PGN format.");
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
              />
            </div>
          </div>

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
              opening={opening}
              moves={moves}
              currentMoveIndex={currentMoveIndex}
              onJumpToMove={handleJumpToMove}
              showBestMoveArrow={showBestMoveArrow}
              onToggleArrow={() => setShowBestMoveArrow(!showBestMoveArrow)}
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
            onImportFen={handleImportFen}
            onImportPgn={handleImportPgn}
            currentFen={game.fen()}
            currentPgn={game.pgn()}
            movesCount={moves.length}
            evalSummary={evaluation?.formattedScore ?? "0.0"}
          />
        </div>
      </main>

      {/* Supabase Saved Games Modal */}
      <SavedGamesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadGame={handleLoadSaved}
      />
    </div>
  );
}
