// Supabase Client and Local Storage Hybrid Store
import { createClient } from "@supabase/supabase-js";

export interface SavedGame {
  id: string;
  created_at: string;
  title: string;
  fen: string;
  pgn: string;
  notes?: string;
  eval_summary?: string;
  moves_count: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const STORAGE_KEY = "chess_study_saved_games";

export async function getSavedGames(): Promise<SavedGame[]> {
  // If Supabase is connected, fetch from database
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("chess_study_games")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as SavedGame[];
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using local storage fallback", err);
    }
  }

  // Local storage fallback
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
  }

  return [];
}

export async function saveGame(game: Omit<SavedGame, "id" | "created_at">): Promise<SavedGame> {
  const newGame: SavedGame = {
    ...game,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    created_at: new Date().toISOString(),
  };

  // Save to Supabase if available
  if (supabase) {
    try {
      await supabase.from("chess_study_games").insert([newGame]);
    } catch (err) {
      console.warn("Supabase insert failed, saving locally", err);
    }
  }

  // Always keep in local storage
  if (typeof window !== "undefined") {
    const current = await getSavedGames();
    const updated = [newGame, ...current.filter((g) => g.id !== newGame.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return newGame;
}

export async function deleteSavedGame(id: string): Promise<void> {
  if (supabase) {
    try {
      await supabase.from("chess_study_games").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete failed", err);
    }
  }

  if (typeof window !== "undefined") {
    const current = await getSavedGames();
    const updated = current.filter((g) => g.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}
