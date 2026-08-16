import type { MovieSummary } from "@/lib/movies/types";
import type { WatchlistRepository } from "./repository";

export interface WatchlistDatabaseGateway {
  findAll(ownerId: string): Promise<MovieSummary[]>;
  upsert(ownerId: string, movie: MovieSummary): Promise<void>;
  delete(ownerId: string, movieId: number): Promise<void>;
}

export class DatabaseWatchlistRepository implements WatchlistRepository {
  constructor(
    private readonly ownerId: string,
    private readonly gateway: WatchlistDatabaseGateway,
  ) {}

  list() {
    return this.gateway.findAll(this.ownerId);
  }

  add(movie: MovieSummary) {
    return this.gateway.upsert(this.ownerId, movie);
  }

  remove(movieId: number) {
    return this.gateway.delete(this.ownerId, movieId);
  }
}
