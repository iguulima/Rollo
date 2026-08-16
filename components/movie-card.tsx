"use client";

import { Plus } from "lucide-react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { MovieImage } from "./movie-image";

type MovieCardProps = {
  movie: MovieSummary;
  canAdd?: boolean;
  onAdd?: (movie: MovieSummary) => void;
  onOpen: (movie: MovieSummary) => void;
};

export function MovieCard({ movie, canAdd = false, onAdd, onOpen }: MovieCardProps) {
  const poster = tmdbImage(movie.posterPath, "w500");

  return (
    <article className="movie-card" title={movie.title} onClick={() => onOpen(movie)}>
      <MovieImage src={poster} alt={`Capa de ${movie.title}`} title={movie.title} sizes="(max-width: 520px) 33vw, (max-width: 900px) 25vw, 13vw" />
      {canAdd && onAdd ? (
        <button
          className="card-add"
          type="button"
          title="Adicionar à watchlist"
          aria-label={`Adicionar ${movie.title} à watchlist`}
          onClick={(event) => {
            event.stopPropagation();
            onAdd(movie);
          }}
        >
          <Plus size={17} strokeWidth={2.2} />
        </button>
      ) : null}
    </article>
  );
}
