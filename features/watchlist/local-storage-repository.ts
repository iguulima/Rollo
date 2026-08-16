import type { MovieSummary } from "@/lib/movies/types";
import type { WatchlistRepository } from "./repository";

export const WATCHLIST_STORAGE_KEY = "rollo.watchlist.v1";

export class LocalStorageWatchlistRepository implements WatchlistRepository {
  async list(): Promise<MovieSummary[]> {
    const stored = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async add(movie: MovieSummary): Promise<void> {
    const current = await this.list();
    if (current.some((item) => item.id === movie.id)) return;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify([movie, ...current]));
  }

  async remove(movieId: number): Promise<void> {
    const current = await this.list();
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(current.filter((movie) => movie.id !== movieId)));
  }
}
