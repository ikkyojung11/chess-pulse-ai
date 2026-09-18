// Stockfish Engine Controller via Web Worker
import { Chess } from "chess.js";

export interface EngineScore {
  cp?: number;
  mate?: number;
}

export interface EngineEvaluation {
  depth: number;
  score: EngineScore;
  winChance: number; // 0 to 100 (for White)
  formattedScore: string; // e.g. "+0.8", "-1.2", "M3"
  bestMoveUci: string; // e.g. "e2e4"
  bestMoveSan?: string; // e.g. "e4"
  pv: string[];
}

export type MoveQuality = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

// User-specified 6-tier move categorization:
// "excellent", "very good", "good", "mistake", "miss", "blunder"
export type UserMoveCategory =
  | "excellent"
  | "very good"
  | "good"
  | "mistake"
  | "miss"
  | "blunder";

export interface EvaluatedMove {
  index: number;
  san: string;
  from: string;
  to: string;
  color: "w" | "b";
  category: UserMoveCategory;
  winChanceBefore: number;
  winChanceAfter: number;
  bestMoveSan?: string;
  bestMoveUci?: string;
  evalScore: string;
}

export interface GameReviewStats {
  whiteCounts: Record<UserMoveCategory, number>;
  blackCounts: Record<UserMoveCategory, number>;
  whiteAccuracy: number;
  blackAccuracy: number;
  moves: EvaluatedMove[];
}

export function cpToWinChance(score: EngineScore, turn: "w" | "b"): number {
  if (score.mate !== undefined) {
    if (score.mate > 0) return turn === "w" ? 100 : 0;
    if (score.mate < 0) return turn === "w" ? 0 : 100;
    return 50;
  }
  const cp = score.cp ?? 0;
  const whiteCp = turn === "w" ? cp : -cp;
  // Standard sigmoid win chance formula
  const winChance = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * whiteCp)) - 1);
  return Math.max(1, Math.min(99, Math.round(winChance)));
}

export function formatScore(score: EngineScore, turn: "w" | "b"): string {
  if (score.mate !== undefined) {
    const whiteMate = turn === "w" ? score.mate : -score.mate;
    return whiteMate > 0 ? `M${whiteMate}` : `-M${Math.abs(whiteMate)}`;
  }
  const cp = score.cp ?? 0;
  const whiteCp = turn === "w" ? cp : -cp;
  const evalScore = (whiteCp / 100).toFixed(1);
  return whiteCp > 0 ? `+${evalScore}` : evalScore === "-0.0" ? "0.0" : evalScore;
}

export function evaluate6TierMoveQuality(
  prevWinChance: number,
  newWinChance: number,
  movedColor: "w" | "b",
  isOpponentMistakeOrBlunder = false
): UserMoveCategory {
  const prevChance = movedColor === "w" ? prevWinChance : 100 - prevWinChance;
  const newChance = movedColor === "w" ? newWinChance : 100 - newWinChance;
  const drop = prevChance - newChance;

  // 1. Miss: Tactical winning chance missed or failed to punish opponent error
  if ((prevChance >= 65 && drop >= 20) || (isOpponentMistakeOrBlunder && drop >= 15)) {
    return "miss";
  }

  // 2. Blunder: Disastrous drop in win chance
  if (drop >= 30) {
    return "blunder";
  }

  // 3. Mistake: Noticeable error
  if (drop >= 14) {
    return "mistake";
  }

  // 4. Good: Reasonable move with moderate drop
  if (drop >= 6) {
    return "good";
  }

  // 5. Very Good: Strong move with minimal drop
  if (drop >= 2) {
    return "very good";
  }

  // 6. Excellent: Optimal move
  return "excellent";
}

export function calculateAccuracy(moves: EvaluatedMove[], color: "w" | "b"): number {
  const playerMoves = moves.filter((m) => m.color === color);
  if (playerMoves.length === 0) return 100;

  let total = 0;
  for (const m of playerMoves) {
    switch (m.category) {
      case "excellent":
        total += 100;
        break;
      case "very good":
        total += 95;
        break;
      case "good":
        total += 80;
        break;
      case "mistake":
        total += 45;
        break;
      case "miss":
        total += 30;
        break;
      case "blunder":
        total += 10;
        break;
    }
  }

  return Math.round((total / playerMoves.length) * 10) / 10;
}

export function buildGameReviewStats(moves: EvaluatedMove[]): GameReviewStats {
  const whiteCounts: Record<UserMoveCategory, number> = {
    excellent: 0,
    "very good": 0,
    good: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
  };
  const blackCounts: Record<UserMoveCategory, number> = {
    excellent: 0,
    "very good": 0,
    good: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
  };

  for (const m of moves) {
    if (m.color === "w") {
      whiteCounts[m.category] = (whiteCounts[m.category] || 0) + 1;
    } else {
      blackCounts[m.category] = (blackCounts[m.category] || 0) + 1;
    }
  }

  return {
    whiteCounts,
    blackCounts,
    whiteAccuracy: calculateAccuracy(moves, "w"),
    blackAccuracy: calculateAccuracy(moves, "b"),
    moves,
  };
}

export function evaluateMoveQuality(
  prevWinChance: number,
  newWinChance: number,
  turn: "w" | "b"
): MoveQuality {
  const prevChance = turn === "w" ? prevWinChance : 100 - prevWinChance;
  const newChance = turn === "w" ? newWinChance : 100 - newWinChance;
  const drop = prevChance - newChance;

  if (drop <= 2) return "best";
  if (drop <= 6) return "excellent";
  if (drop <= 12) return "good";
  if (drop <= 22) return "inaccuracy";
  if (drop <= 40) return "mistake";
  return "blunder";
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private isReady = false;
  private onEvalCallback: ((evalData: EngineEvaluation) => void) | null = null;
  private currentFen = "";

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === "undefined") return;

    try {
      // Check for WebAssembly support and use wasm worker if available
      const wasmSupported = typeof WebAssembly === "object";
      const scriptUrl = wasmSupported ? "/stockfish.wasm.js" : "/stockfish.js";
      this.worker = new Worker(scriptUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        this.handleMessage(e.data);
      };

      this.worker.onerror = () => {
        console.warn("Stockfish wasm worker error, falling back to stockfish.js");
        if (this.worker) this.worker.terminate();
        this.worker = new Worker("/stockfish.js");
        this.worker.onmessage = (e: MessageEvent) => this.handleMessage(e.data);
        this.sendCommand("uci");
      };

      this.sendCommand("uci");
    } catch (err) {
      console.error("Failed to initialize Stockfish worker:", err);
    }
  }

  private sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleMessage(line: string) {
    if (typeof line !== "string") return;

    if (line === "uciok") {
      this.isReady = true;
      this.sendCommand("isready");
      this.sendCommand("setoption name MultiPV value 1");
      return;
    }

    if (line.startsWith("info depth") && line.includes("score")) {
      this.parseInfoLine(line);
    }
  }

  private parseInfoLine(line: string) {
    try {
      const depthMatch = line.match(/\bdepth (\d+)/);
      const cpMatch = line.match(/\bscore cp (-?\d+)/);
      const mateMatch = line.match(/\bscore mate (-?\d+)/);
      const pvMatch = line.match(/\bpv (.+)/);

      const depth = depthMatch ? parseInt(depthMatch[1], 10) : 0;
      let score: EngineScore = {};

      if (mateMatch) {
        score = { mate: parseInt(mateMatch[1], 10) };
      } else if (cpMatch) {
        score = { cp: parseInt(cpMatch[1], 10) };
      }

      const pvMoves = pvMatch ? pvMatch[1].trim().split(" ") : [];
      const bestMoveUci = pvMoves[0] || "";

      // Determine turn from current FEN
      const turn: "w" | "b" = this.currentFen.includes(" b ") ? "b" : "w";
      const winChance = cpToWinChance(score, turn);
      const formatted = formatScore(score, turn);

      // Convert UCI move to SAN (e.g. e2e4 -> e4) using chess.js
      let bestMoveSan = bestMoveUci;
      if (bestMoveUci && this.currentFen) {
        try {
          const tempGame = new Chess(this.currentFen);
          const from = bestMoveUci.slice(0, 2);
          const to = bestMoveUci.slice(2, 4);
          const promotion = bestMoveUci.slice(4, 5) || undefined;
          const move = tempGame.move({ from, to, promotion });
          if (move) {
            bestMoveSan = move.san;
          }
        } catch {
          // fallback to uci
        }
      }

      if (this.onEvalCallback && bestMoveUci) {
        this.onEvalCallback({
          depth,
          score,
          winChance,
          formattedScore: formatted,
          bestMoveUci,
          bestMoveSan,
          pv: pvMoves.slice(0, 5),
        });
      }
    } catch (e) {
      console.error("Error parsing Stockfish line:", e);
    }
  }

  public analyzePosition(
    fen: string,
    depth = 15,
    onUpdate: (evalData: EngineEvaluation) => void
  ) {
    this.currentFen = fen;
    this.onEvalCallback = onUpdate;

    // Stop previous search and start new position analysis
    this.sendCommand("stop");
    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);
  }

  public async evaluatePositionAsync(
    fen: string,
    targetDepth = 10
  ): Promise<EngineEvaluation> {
    return new Promise((resolve) => {
      let latest: EngineEvaluation | null = null;
      let timer: NodeJS.Timeout | null = null;

      const finish = () => {
        if (timer) clearTimeout(timer);
        if (latest) {
          resolve(latest);
        } else {
          resolve({
            depth: 0,
            score: {},
            winChance: 50,
            formattedScore: "0.0",
            bestMoveUci: "",
            pv: [],
          });
        }
      };

      timer = setTimeout(finish, 1500);

      this.analyzePosition(fen, targetDepth, (evalData) => {
        latest = evalData;
        if (evalData.depth >= targetDepth) {
          finish();
        }
      });
    });
  }

  public stop() {
    this.sendCommand("stop");
    this.onEvalCallback = null;
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
