// Interactive Chessboard with Best Move Arrow and Move Highlights
import React, { useState, useRef, useEffect } from "react";
import { Chess, Square, PieceSymbol, Color, Move } from "chess.js";
import { ChessPiece } from "./ChessPiece";
import { PawnPromotionModal } from "./PawnPromotionModal";
import { soundManager } from "@/lib/audio/sounds";

interface ChessBoardProps {
  game: Chess;
  flipped: boolean;
  bestMoveUci?: string;
  showBestMoveArrow?: boolean;
  onMoveMade: (move: Move, newGame: Chess) => void;
  disabled?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  flipped,
  bestMoveUci,
  showBestMoveArrow = true,
  onMoveMade,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalDestinations, setLegalDestinations] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
    color: Color;
  } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  // Sync last move from game history
  useEffect(() => {
    const history = game.history({ verbose: true });
    if (history.length > 0) {
      const last = history[history.length - 1];
      setLastMove({ from: last.from as Square, to: last.to as Square });
    } else {
      setLastMove(null);
    }
  }, [game]);

  // Files and ranks based on orientation
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  // Find King square if in check
  const inCheckSquare: Square | null = (() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === "k" && piece.color === turn) {
          return piece.square as Square;
        }
      }
    }
    return null;
  })();

  const selectSquare = (square: Square) => {
    if (disabled) return;

    // If a square is already selected, check if clicked square is a legal destination
    if (selectedSquare) {
      if (legalDestinations.includes(square)) {
        attemptMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalDestinations([]);
        return;
      }
    }

    // Otherwise, select the piece if it belongs to current player
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setLegalDestinations(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setLegalDestinations([]);
    }
  };

  const attemptMove = (from: Square, to: Square, promotionPiece?: "q" | "r" | "b" | "n") => {
    const piece = game.get(from);
    if (!piece) return;

    // Check for pawn promotion
    const isPawn = piece.type === "p";
    const isPromotionRank = (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");

    if (isPawn && isPromotionRank && !promotionPiece) {
      setPendingPromotion({ from, to, color: piece.color });
      return;
    }

    try {
      // Create new clone of Chess instance
      const clone = new Chess(game.fen());
      const move = clone.move({
        from,
        to,
        promotion: promotionPiece || "q",
      });

      if (move) {
        // Play appropriate sound
        if (clone.isGameOver()) {
          soundManager.playVictory();
        } else if (clone.inCheck()) {
          soundManager.playCheck();
        } else if (move.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        setLastMove({ from, to });
        onMoveMade(move, clone);
      }
    } catch (e) {
      console.warn("Invalid move:", e);
      soundManager.playIllegal();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (disabled) return;
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      e.dataTransfer.setData("text/plain", square);
      selectSquare(square);
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const fromSquare = e.dataTransfer.getData("text/plain") as Square;
    if (fromSquare && legalDestinations.includes(targetSquare)) {
      attemptMove(fromSquare, targetSquare);
      setSelectedSquare(null);
      setLegalDestinations([]);
    }
  };

  // Calculate coordinates for Best Move Arrow
  const getSquareCoordinates = (sq: string) => {
    if (sq.length < 2) return null;
    const file = sq[0];
    const rank = sq[1];
    const fileIdx = displayFiles.indexOf(file);
    const rankIdx = displayRanks.indexOf(rank);

    if (fileIdx === -1 || rankIdx === -1) return null;

    // Center of square in percentage (0 to 100)
    const x = (fileIdx + 0.5) * (100 / 8);
    const y = (rankIdx + 0.5) * (100 / 8);
    return { x, y };
  };

  const bestArrowCoords = (() => {
    if (!showBestMoveArrow || !bestMoveUci || bestMoveUci.length < 4) return null;
    const fromSq = bestMoveUci.slice(0, 2);
    const toSq = bestMoveUci.slice(2, 4);
    const start = getSquareCoordinates(fromSq);
    const end = getSquareCoordinates(toSq);
    if (!start || !end) return null;
    return { start, end };
  })();

  return (
    <div className="relative aspect-square w-full max-w-[580px] rounded-lg overflow-hidden shadow-2xl border-2 border-zinc-800 select-none bg-[#769656]">
      {/* 8x8 Board Grid */}
      <div ref={boardRef} className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = (file + rank) as Square;
            const piece = game.get(square);
            const isLight = (fileIdx + rankIdx) % 2 === 0;

            const isSelected = selectedSquare === square;
            const isLegalDest = legalDestinations.includes(square);
            const isLastMoveFrom = lastMove?.from === square;
            const isLastMoveTo = lastMove?.to === square;
            const isKingInCheck = inCheckSquare === square;

            // Background color computation
            let bgClass = isLight ? "bg-[#eeeed2]" : "bg-[#769656]";
            if (isLastMoveFrom || isLastMoveTo) {
              bgClass = isLight ? "bg-[#f7f769]" : "bg-[#baca44]";
            }
            if (isSelected) {
              bgClass = "bg-[#bbcb2b] ring-2 ring-inset ring-[#829769]";
            }

            return (
              <div
                key={square}
                onClick={() => selectSquare(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center ${bgClass} cursor-pointer transition-colors duration-100`}
              >
                {/* Rank & File Coordinate Labels */}
                {fileIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold select-none ${
                      isLight ? "text-[#769656]" : "text-[#eeeed2]"
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold select-none ${
                      isLight ? "text-[#769656]" : "text-[#eeeed2]"
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* King in Check Red Aura */}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-radial from-red-600/80 via-red-500/40 to-transparent animate-pulse" />
                )}

                {/* Chess Piece */}
                {piece && (
                  <div
                    draggable={!disabled && piece.color === game.turn()}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full p-1 z-10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalDest && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    {piece ? (
                      // Capture ring
                      <div className="w-full h-full rounded-full border-4 border-black/25 box-border" />
                    ) : (
                      // Empty square dot
                      <div className="w-3.5 h-3.5 rounded-full bg-black/25" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Best Move Arrow Overlay */}
      {bestArrowCoords && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="best-arrowhead"
              markerWidth="4"
              markerHeight="4"
              refX="2.5"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0.5, 3.5 2, 0 3.5" fill="#10b981" />
            </marker>
          </defs>
          <line
            x1={bestArrowCoords.start.x}
            y1={bestArrowCoords.start.y}
            x2={bestArrowCoords.end.x}
            y2={bestArrowCoords.end.y}
            stroke="#10b981"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.85"
            markerEnd="url(#best-arrowhead)"
            className="drop-shadow-md"
          />
        </svg>
      )}

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <PawnPromotionModal
          color={pendingPromotion.color}
          isOpen={true}
          onSelect={(promotedPiece) => {
            attemptMove(pendingPromotion.from, pendingPromotion.to, promotedPiece);
            setPendingPromotion(null);
            setSelectedSquare(null);
            setLegalDestinations([]);
          }}
        />
      )}
    </div>
  );
};
