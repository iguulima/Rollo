import type { MovieSummary } from "@/lib/movies/types";

export interface WatchlistRepository {
  list(): Promise<MovieSummary[]>;
  add(movie: MovieSummary): Promise<void>;
  remove(movieId: number): Promise<void>;
}
