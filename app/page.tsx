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
import { Flame, Database, ShieldCheck, Trophy, Sparkles } from "lucide-react";

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

  // Handle user or bot move
  const handleMoveMade = (move: Move, newGame: Chess) => {
    const prevChance = prevWinChanceRef.current;
    const turn = game.turn(); // player who made the move

    // Update game state
    setGame(newGame);
    const newMoves = [...moves.slice(0, currentMoveIndex + 1), move];
    setMoves(newMoves);
    setCurrentMoveIndex(newMoves.length - 1);

    // Run engine analysis on new position
    if (engineRef.current) {
      engineRef.current.analyzePosition(newGame.fen(), 14, (evalData) => {
        setEvaluation(evalData);

        // Calculate move quality (Best, Good, Inaccuracy, Blunder)
        const quality = evaluateMoveQuality(prevChance, evalData.winChance, turn);
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
    if (gameMode === "analysis" || game.isGameOver() || isBotThinking) return;

    const isBotTurn =
      (gameMode === "play_white" && game.turn() === "b") ||
      (gameMode === "play_black" && game.turn() === "w");

    if (isBotTurn) {
      setIsBotThinking(true);
      const timer = setTimeout(() => {
        const legalMoves = game.moves({ verbose: true });
        if (legalMoves.length === 0) {
          setIsBotThinking(false);
          return;
        }

        let chosenMove: Move | null = null;

        // Pick best move or alternative depending on difficulty
        const bestUci = evaluation?.bestMoveUci;
        const bestLegalMove = bestUci
          ? legalMoves.find(
              (m) =>
                m.from === bestUci.slice(0, 2) &&
                m.to === bestUci.slice(2, 4) &&
                (!m.promotion || m.promotion === bestUci.slice(4, 5))
            )
          : null;

        const rand = Math.random();
        if (botDifficulty === "hard") {
          chosenMove = bestLegalMove || legalMoves[Math.floor(Math.random() * legalMoves.length)];
        } else if (botDifficulty === "medium") {
          chosenMove = rand < 0.7 && bestLegalMove
            ? bestLegalMove
            : legalMoves[Math.floor(Math.random() * legalMoves.length)];
        } else {
          // Easy
          chosenMove = rand < 0.35 && bestLegalMove
            ? bestLegalMove
            : legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        if (chosenMove) {
          const clone = new Chess(game.fen());
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

      return () => clearTimeout(timer);
    }
  }, [game, gameMode, botDifficulty, evaluation?.bestMoveUci]);

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

          {/* Game Status Banner */}
          <div className="w-full max-w-[580px] mt-3 px-2 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  game.turn() === "w" ? "bg-white border border-zinc-600" : "bg-zinc-900 border border-zinc-500"
                }`}
              />
              <span className="font-semibold text-zinc-200">
                {game.turn() === "w" ? "White to move" : "Black to move"}
              </span>
              {isBotThinking && (
                <span className="text-emerald-400 animate-pulse text-[11px]">(Bot thinking...)</span>
              )}
            </div>

            <div>
              {game.isGameOver() && (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  {game.isCheckmate()
                    ? `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins`
                    : game.isDraw()
                    ? "Draw!"
                    : "Game Over"}
                </span>
              )}
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
