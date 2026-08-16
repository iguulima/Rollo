"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { LocalStorageWatchedRepository, WATCHED_STORAGE_KEY } from "./local-storage-repository";

export function useWatched() {
  const repository = useMemo(() => new LocalStorageWatchedRepository(), []);
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repository.list().then((stored) => {
      setMovies(stored);
      setReady(true);
    });
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key === WATCHED_STORAGE_KEY) repository.list().then(setMovies);
    };
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
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
