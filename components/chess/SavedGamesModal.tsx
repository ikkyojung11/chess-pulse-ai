// Supabase Saved Games & Study Notes Modal
import React, { useState, useEffect } from "react";
import { SavedGame, getSavedGames, deleteSavedGame } from "@/lib/supabase/client";
import { X, Trash2, Play, Calendar, Hash, FileText } from "lucide-react";

interface SavedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGame: (fen: string, pgn: string) => void;
}

export const SavedGamesModal: React.FC<SavedGamesModalProps> = ({
  isOpen,
  onClose,
  onLoadGame,
}) => {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen]);

  const loadList = async () => {
    setLoading(true);
    try {
      const list = await getSavedGames();
      setGames(list);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this saved study game?")) {
      await deleteSavedGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Saved Study Sessions (Supabase)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review and load your previous analysis games and notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-800/60">
          {loading ? (
            <div className="text-center py-10 text-zinc-400 text-sm">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">
              No saved study games yet. Click \"Save Game\" during analysis to store games and notes!
            </div>
          ) : (
            games.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  onLoadGame(g.fen, g.pgn);
                  onClose();
                }}
                className="py-3 px-2 flex items-center justify-between hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 truncate">
                    {g.title}
                  </h4>
                  {g.notes && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{g.notes}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(g.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {g.moves_count} moves
                    </span>
                    {g.eval_summary && (
                      <span className="text-emerald-400/90">{g.eval_summary}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onLoadGame(g.fen, g.pgn);
                      onClose();
                    }}
                    className="p-2 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                    title="Load Game"
                  >
                    <Play className="w-4 h-4 fill-emerald-400" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, g.id)}
                    className="p-2 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
