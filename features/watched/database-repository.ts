import type { MovieSummary } from "@/lib/movies/types";
import type { WatchedRepository } from "./repository";

export interface WatchedDatabaseGateway {
  findAll(ownerId: string): Promise<MovieSummary[]>;
  upsert(ownerId: string, movie: MovieSummary): Promise<void>;
  delete(ownerId: string, movieId: number): Promise<void>;
}

export class DatabaseWatchedRepository implements WatchedRepository {
  constructor(
    private readonly ownerId: string,
    private readonly gateway: WatchedDatabaseGateway,
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
