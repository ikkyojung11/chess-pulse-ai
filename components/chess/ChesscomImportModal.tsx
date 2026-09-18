// Chess.com Game Importer Modal
import React, { useState } from "react";
import {
  X,
  Search,
  Download,
  Calendar,
  Clock,
  Swords,
  CheckCircle,
  XCircle,
  HelpCircle,
  Link,
  FileText,
  Sparkles,
} from "lucide-react";

export interface ChesscomGameItem {
  id: string;
  url: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
  time_control: string;
  time_class: string;
  end_time: string | null;
  pgn: string;
}

interface ChesscomImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: ChesscomGameItem, userColor?: "white" | "black") => void;
  onDirectPgnImport: (pgn: string) => void;
}

export const ChesscomImportModal: React.FC<ChesscomImportModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
  onDirectPgnImport,
}) => {
  const [activeTab, setActiveTab] = useState<"username" | "pgn">("username");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<ChesscomGameItem[]>([]);

  const [directPgn, setDirectPgn] = useState("");

  if (!isOpen) return null;

  const handleFetchGames = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = username.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chesscom?username=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "대국 목록을 불러오지 못했습니다.");
        setGames([]);
      } else {
        setGames(data.games || []);
        if ((data.games || []).length === 0) {
          setError("최근 대국 기록이 없습니다.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPgnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPgn.trim()) return;
    onDirectPgnImport(directPgn.trim());
    onClose();
  };

  const getResultBadge = (userColor: "white" | "black", result: string) => {
    const isWin = result === "win";
    const isDraw = [
      "agreed",
      "repetition",
      "stalemate",
      "timevsinsufficient",
      "insufficient",
    ].includes(result);

    if (isWin) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          WIN
        </span>
      );
    }
    if (isDraw) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-zinc-700 text-zinc-300">
          DRAW
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-500/30">
        LOSS
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#769656]/30 border border-[#769656]/50 flex items-center justify-center text-emerald-400 font-bold">
              ♟
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Chess.com 대국 불러오기 & 복기
              </h2>
              <p className="text-xs text-zinc-400">
                Chess.com 아이디로 최근 대국을 가져와 6단계 수 분석을 시작합니다
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1 gap-1">
          <button
            onClick={() => setActiveTab("username")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "username"
                ? "bg-zinc-800 text-emerald-400 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>아이디로 대국 검색</span>
          </button>

          <button
            onClick={() => setActiveTab("pgn")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "pgn"
                ? "bg-zinc-800 text-emerald-400 shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PGN / 링크 직접 붙여넣기</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "username" ? (
            <div className="space-y-4">
              <form onSubmit={handleFetchGames} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Chess.com 아이디 (예: hikaru, erik, 본인 ID)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500 pl-9"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {loading ? "조회 중..." : "대국 조회"}
                </button>
              </form>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {error}
                </div>
              )}

              {/* Games List */}
              {games.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400">
                    최근 대국 목록 ({games.length}개)
                  </span>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {games.map((g) => {
                      const lowerUser = username.toLowerCase();
                      const isUserWhite = g.white.username.toLowerCase() === lowerUser;
                      const userColor = isUserWhite ? "white" : "black";
                      const userResult = isUserWhite ? g.white.result : g.black.result;
                      const opponent = isUserWhite ? g.black : g.white;

                      return (
                        <div
                          key={g.id}
                          className="p-3 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 rounded-xl transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-600 inline-block" />
                              <span className="truncate">{g.white.username} ({g.white.rating})</span>
                              <span className="text-zinc-500">vs</span>
                              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-500 inline-block" />
                              <span className="truncate">{g.black.username} ({g.black.rating})</span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                              <span className="bg-zinc-800 px-1.5 py-0.5 rounded-sm font-mono capitalize">
                                {g.time_class}
                              </span>
                              {g.end_time && (
                                <span>{new Date(g.end_time).toLocaleDateString()}</span>
                              )}
                              {getResultBadge(userColor, userResult)}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSelectGame(g, userColor);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>복기 시작</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleDirectPgnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  PGN 기보 또는 대국 텍스트 붙여넣기
                </label>
                <textarea
                  rows={8}
                  required
                  value={directPgn}
                  onChange={(e) => setDirectPgn(e.target.value)}
                  placeholder="[Event &quot;Live Chess&quot;]&#10;[White &quot;Player1&quot;]&#10;[Black &quot;Player2&quot;]&#10;1. e4 e5 2. Nf3 Nc6 3. Bc4..."
                  className="w-full font-mono text-xs bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>대국 로드 및 복기</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
