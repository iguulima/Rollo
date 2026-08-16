"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { LocalStorageWatchlistRepository } from "./local-storage-repository";

export function useWatchlist() {
  const repository = useMemo(() => new LocalStorageWatchlistRepository(), []);
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repository.list().then((stored) => {
      setMovies(stored);
      setReady(true);
    });
  }, [repository]);

  const add = useCallback(async (movie: MovieSummary) => {
    await repository.add(movie);
    setMovies(await repository.list());
  }, [repository]);

  const remove = useCallback(async (movieId: number) => {
    await repository.remove(movieId);
    setMovies(await repository.list());
  }, [repository]);

  return { movies, ready, add, remove, has: (id: number) => movies.some((movie) => movie.id === id) };
}
