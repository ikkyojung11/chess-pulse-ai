// Game Controls & Mode Toolbar
import React, { useState } from "react";
import {
  RotateCcw,
  Repeat,
  Undo2,
  BookmarkPlus,
  FolderArchive,
  Bot,
  Compass,
  Download,
  Upload,
} from "lucide-react";
import { saveGame } from "@/lib/supabase/client";

export type GameMode = "analysis" | "play_white" | "play_black";
export type BotDifficulty = "easy" | "medium" | "hard";

interface GameControlsProps {
  mode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  botDifficulty: BotDifficulty;
  onChangeDifficulty: (diff: BotDifficulty) => void;
  onNewGame: () => void;
  onFlipBoard: () => void;
  onUndoMove: () => void;
  onOpenSavedModal: () => void;
  onImportFen: (fen: string) => void;
  onImportPgn: (pgn: string) => void;
  currentFen: string;
  currentPgn: string;
  movesCount: number;
  evalSummary: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  mode,
  onChangeMode,
  botDifficulty,
  onChangeDifficulty,
  onNewGame,
  onFlipBoard,
  onUndoMove,
  onOpenSavedModal,
  onImportFen,
  onImportPgn,
  currentFen,
  currentPgn,
  movesCount,
  evalSummary,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveNotes, setSaveNotes] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    setIsSaving(true);
    try {
      await saveGame({
        title: saveTitle.trim(),
        notes: saveNotes.trim(),
        fen: currentFen,
        pgn: currentPgn,
        moves_count: movesCount,
        eval_summary: evalSummary,
      });
      setShowSaveModal(false);
      setSaveTitle("");
      setSaveNotes("");
      alert("Game successfully saved to study sessions!");
    } catch (err) {
      console.error(err);
      alert("Failed to save game");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = importText.trim();
    if (!text) return;

    if (text.includes("[Event ") || text.includes("1.")) {
      onImportPgn(text);
    } else {
      onImportFen(text);
    }
    setShowImportModal(false);
    setImportText("");
  };

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
      {/* Mode Selection Tabs */}
      <div className="flex items-center justify-between gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => onChangeMode("analysis")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mode === "analysis"
              ? "bg-zinc-800 text-emerald-400 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Analysis Mode</span>
        </button>

        <button
          onClick={() => onChangeMode("play_white")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mode !== "analysis"
              ? "bg-zinc-800 text-emerald-400 shadow-xs"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Play vs Bot</span>
        </button>
      </div>

      {/* Bot Controls (visible when playing vs Bot) */}
      {mode !== "analysis" && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>Play as:</span>
            <button
              onClick={() => onChangeMode(mode === "play_white" ? "play_black" : "play_white")}
              className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded cursor-pointer hover:bg-zinc-700"
            >
              {mode === "play_white" ? "White ♔" : "Black ♚"}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-zinc-500 mr-1">Level:</span>
            {(["easy", "medium", "hard"] as BotDifficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onChangeDifficulty(d)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                  botDifficulty === d
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Board Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-zinc-700/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>

        <button
          onClick={onUndoMove}
          disabled={movesCount === 0}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white disabled:opacity-40 disabled:hover:bg-zinc-800 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-zinc-700/60"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Take Back</span>
        </button>

        <button
          onClick={onFlipBoard}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-zinc-700/60"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Flip Board</span>
        </button>
      </div>

      {/* Study & Storage Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
        <button
          onClick={() => {
            setSaveTitle(`Study Session #${movesCount} moves (${evalSummary})`);
            setShowSaveModal(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Save Game</span>
        </button>

        <button
          onClick={onOpenSavedModal}
          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Saved Sessions</span>
        </button>
      </div>

      {/* Import / Export Row */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
        <button
          onClick={() => setShowImportModal(true)}
          className="hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
        >
          <Upload className="w-3 h-3" />
          Import FEN / PGN
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(currentPgn || currentFen);
            alert("PGN/FEN copied to clipboard!");
          }}
          className="hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3 h-3" />
          Export PGN
        </button>
      </div>

      {/* Save Game Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSave}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-base font-bold text-white mb-1">Save Study Session</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Save current position and moves to Supabase & local storage
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g. Italian Game Tactics"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Study Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="What key tactics or lessons occurred in this game?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleImportSubmit}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-base font-bold text-white mb-1">Import Position or Game</h3>
            <p className="text-xs text-zinc-400 mb-4">Paste a FEN string or PGN notation below</p>

            <textarea
              rows={5}
              required
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="e.g. rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
              className="w-full font-mono text-xs bg-zinc-800 border border-zinc-700 rounded-md p-3 text-white focus:outline-hidden focus:border-emerald-500"
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
              >
                Load Position
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
