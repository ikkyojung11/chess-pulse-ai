// Vector SVG Chess Pieces
import React from "react";
import { PieceSymbol, Color } from "chess.js";

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = "w-full h-full" }) => {
  const isWhite = color === "w";
  const fill = isWhite ? "#ffffff" : "#1e293b";
  const stroke = isWhite ? "#1e293b" : "#ffffff";
  const strokeWidth = 1.5;

  switch (type) {
    case "p": // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      );

    case "r": // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
            <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5" />
            <path d="M 11,14 L 34,14" />
          </g>
        </svg>
      );

    case "n": // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.02,5.38 19.5,6.5 C 20,7 21.6,8.55 22,10 z" />
            <circle cx="15" cy="14" r="1.5" fill={stroke} />
            <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill={stroke} />
          </g>
        </svg>
      );

    case "b": // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.33,35 15.67,35 19,36 C 21,36 24,36 26,36 C 29.33,35 32.67,35 36,36 C 36,36 37.67,36.5 39,38 C 34.67,37.67 29.67,37.33 22.5,37.33 C 15.33,37.33 10.33,37.67 6,38 C 7.33,36.5 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 22.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z" />
            <path d="M 17.5,26 C 15,22.5 16,16 22.5,11 C 29,16 30,22.5 27.5,26 C 22.5,26 17.5,26 17.5,26 z" />
            <path d="M 20,15 L 25,15" />
            <path d="M 22.5,12.5 L 22.5,20" />
          </g>
        </svg>
      );

    case "q": // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9 13 A 2 2 0 1 1 5,13 A 2 2 0 1 1 9 13 z" />
            <path d="M 16 9 A 2 2 0 1 1 12,9 A 2 2 0 1 1 16 9 z" />
            <path d="M 24.5 7.5 A 2 2 0 1 1 20.5,7.5 A 2 2 0 1 1 24.5 7.5 z" />
            <path d="M 33 9 A 2 2 0 1 1 29,9 A 2 2 0 1 1 33 9 z" />
            <path d="M 40 13 A 2 2 0 1 1 36,13 A 2 2 0 1 1 40 13 z" />
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 L 9,26 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 10.5,36 12,37 22.5,37 C 33,37 34.5,36 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
          </g>
        </svg>
      );

    case "k": // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {/* Cross */}
            <path d="M 22.5,11.63 L 22.5,6" />
            <path d="M 20,8 L 25,8" />
            {/* Crown */}
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25 z" />
            <path d="M 11.5,37 C 17,40.5 27,40.5 33.5,37 C 37,34.5 37,32 37,32 C 37,28 33,26 31.5,23 C 30,20 28,19 25.5,18 C 23.5,17 21.5,17 19.5,18 C 17,19 15,20 13.5,23 C 12,26 8,28 8,32 C 8,32 8,34.5 11.5,37 z" />
            <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
            <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
