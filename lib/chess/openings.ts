// ECO Opening Database
export interface ChessOpening {
  eco: string;
  name: string;
  moves: string;
  fen?: string;
}

export const OPENINGS: ChessOpening[] = [
  { eco: "C50", name: "Italian Game", moves: "e4 e5 Nf3 Nc6 Bc4" },
  { eco: "C51", name: "Evans Gambit", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4" },
  { eco: "C55", name: "Two Knights Defense", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6" },
  { eco: "C60", name: "Ruy Lopez", moves: "e4 e5 Nf3 Nc6 Bb5" },
  { eco: "C65", name: "Ruy Lopez: Berlin Defense", moves: "e4 e5 Nf3 Nc6 Bb5 Nf6" },
  { eco: "C70", name: "Ruy Lopez: Morphy Defense", moves: "e4 e5 Nf3 Nc6 Bb5 a6" },
  { eco: "B20", name: "Sicilian Defense", moves: "e4 c5" },
  { eco: "B21", name: "Sicilian Defense: Grand Prix Attack", moves: "e4 c5 f4" },
  { eco: "B22", name: "Sicilian Defense: Alapin Variation", moves: "e4 c5 c3" },
  { eco: "B23", name: "Sicilian Defense: Closed", moves: "e4 c5 Nc3" },
  { eco: "B33", name: "Sicilian Defense: Sveshnikov", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5" },
  { eco: "B90", name: "Sicilian Defense: Najdorf Variation", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6" },
  { eco: "C00", name: "French Defense", moves: "e4 e6" },
  { eco: "C02", name: "French Defense: Advance Variation", moves: "e4 e6 d4 d5 e5" },
  { eco: "C10", name: "French Defense: Paulsen Variation", moves: "e4 e6 d4 d5 Nc3" },
  { eco: "B10", name: "Caro-Kann Defense", moves: "e4 c6" },
  { eco: "B12", name: "Caro-Kann: Advance Variation", moves: "e4 c6 d4 d5 e5" },
  { eco: "B15", name: "Caro-Kann: Classical Variation", moves: "e4 c6 d4 d5 Nc3 dxe4 Nxe4" },
  { eco: "B01", name: "Scandinavian Defense", moves: "e4 d5" },
  { eco: "B01", name: "Scandinavian: Main Line", moves: "e4 d5 exd5 Qxd5" },
  { eco: "B07", name: "Pirc Defense", moves: "e4 d6 d4 Nf6 Nc3 g6" },
  { eco: "B06", name: "Modern Defense", moves: "e4 g6" },
  { eco: "B02", name: "Alekhine Defense", moves: "e4 Nf6" },
  { eco: "C42", name: "Petrov Defense", moves: "e4 e5 Nf3 Nf6" },
  { eco: "C44", name: "Scotch Game", moves: "e4 e5 Nf3 Nc6 d4" },
  { eco: "C45", name: "Scotch Game: Classical", moves: "e4 e5 Nf3 Nc6 d4 exd4 Nxd4" },
  { eco: "C41", name: "Philidor Defense", moves: "e4 e5 Nf3 d6" },
  { eco: "C23", name: "Bishop\x27s Opening", moves: "e4 e5 Bc4" },
  { eco: "C21", name: "Danish Gambit", moves: "e4 e5 d4 exd4 c3" },
  { eco: "C30", name: "King\x27s Gambit", moves: "e4 e5 f4" },
  { eco: "D00", name: "Queen\x27s Pawn Game", moves: "d4 d5" },
  { eco: "D02", name: "London System", moves: "d4 d5 Nf3 Nf6 Bf4" },
  { eco: "D02", name: "London System (Early Bf4)", moves: "d4 Nf6 Nf3 d5 Bf4" },
  { eco: "D06", name: "Queen\x27s Gambit", moves: "d4 d5 c4" },
  { eco: "D20", name: "Queen\x27s Gambit Accepted", moves: "d4 d5 c4 dxc4" },
  { eco: "D30", name: "Queen\x27s Gambit Declined", moves: "d4 d5 c4 e6" },
  { eco: "D10", name: "Slav Defense", moves: "d4 d5 c4 c6" },
  { eco: "D43", name: "Semi-Slav Defense", moves: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6" },
  { eco: "E60", name: "King\x27s Indian Defense", moves: "d4 Nf6 c4 g6" },
  { eco: "E61", name: "King\x27s Indian: Classical", moves: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O" },
  { eco: "E20", name: "Nimzo-Indian Defense", moves: "d4 Nf6 c4 e6 Nc3 Bb4" },
  { eco: "E12", name: "Queen\x27s Indian Defense", moves: "d4 Nf6 c4 e6 Nf3 b6" },
  { eco: "E00", name: "Catalan Opening", moves: "d4 Nf6 c4 e6 g3" },
  { eco: "A56", name: "Benoni Defense", moves: "d4 Nf6 c4 c5" },
  { eco: "A80", name: "Dutch Defense", moves: "d4 f5" },
  { eco: "A10", name: "English Opening", moves: "c4" },
  { eco: "A15", name: "English Opening: Anglo-Indian", moves: "c4 Nf6" },
  { eco: "A20", name: "English Opening: King\x27s English", moves: "c4 e5" },
  { eco: "A04", name: "Reti Opening", moves: "Nf3" },
  { eco: "A00", name: "Grob Opening", moves: "g4" }
];

export function findOpening(sanMoves: string[]): ChessOpening | null {
  if (sanMoves.length === 0) return null;
  const currentStr = sanMoves.join(" ");

  let bestMatch: ChessOpening | null = null;
  let maxMovesCount = 0;

  for (const opening of OPENINGS) {
    if (currentStr.startsWith(opening.moves)) {
      const moveCount = opening.moves.split(" ").length;
      if (moveCount > maxMovesCount) {
        maxMovesCount = moveCount;
        bestMatch = opening;
      }
    }
  }

  return bestMatch;
}
