import type { MovieSummary } from "@/lib/movies/types";
import type { WatchedRepository } from "./repository";

export const WATCHED_STORAGE_KEY = "rollo.watched.v1";

export class LocalStorageWatchedRepository implements WatchedRepository {
  async list(): Promise<MovieSummary[]> {
    const stored = window.localStorage.getItem(WATCHED_STORAGE_KEY);
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
    const withoutMovie = current.filter((item) => item.id !== movie.id);
    window.localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify([movie, ...withoutMovie]));
  }

  async remove(movieId: number): Promise<void> {
    const current = await this.list();
    window.localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(current.filter((movie) => movie.id !== movieId)));
  }
}
