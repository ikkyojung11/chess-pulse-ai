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

export function evaluateMoveQuality(
  prevWinChance: number,
  newWinChance: number,
  turn: "w" | "b"
): MoveQuality {
  // Win chance from current player's perspective
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
