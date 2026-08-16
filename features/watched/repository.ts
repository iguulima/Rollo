import type { MovieSummary } from "@/lib/movies/types";

export interface WatchedRepository {
  list(): Promise<MovieSummary[]>;
  add(movie: MovieSummary): Promise<void>;
  remove(movieId: number): Promise<void>;
}
