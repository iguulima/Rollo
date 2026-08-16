"use client";

import { ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import type { DragEvent, MouseEvent } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { MovieImage } from "./movie-image";

type MovieCardProps = {
  movie: MovieSummary;
  canAdd?: boolean;
  onAdd?: (movie: MovieSummary) => void;
  onOpen: (movie: MovieSummary) => void;
  onContextMenu?: (movie: MovieSummary, event: MouseEvent<HTMLElement>) => void;
  manualOrder?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  canMoveBackward?: boolean;
  canMoveForward?: boolean;
  onMove?: (movieId: number, direction: -1 | 1) => void;
  onDragStart?: (movieId: number, event: DragEvent<HTMLElement>) => void;
  onDragEnter?: (movieId: number) => void;
  onDrop?: (movieId: number, event: DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
};

export function MovieCard({ movie, canAdd = false, onAdd, onOpen, onContextMenu, manualOrder = false, dragging = false, dropTarget = false, canMoveBackward, canMoveForward, onMove, onDragStart, onDragEnter, onDrop, onDragEnd }: MovieCardProps) {
  const poster = tmdbImage(movie.posterPath, "w500");
  const className = ["movie-card", manualOrder && "manual-order", dragging && "is-dragging", dropTarget && "is-drop-target"].filter(Boolean).join(" ");

  return (
    <article
      className={className}
      style={{ viewTransitionName: `movie-${movie.id}` }}
      title={movie.title}
      tabIndex={0}
      draggable={manualOrder}
      onClick={() => onOpen(movie)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(movie, event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(movie);
        }
      }}
      onDragStart={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const preview = event.currentTarget.cloneNode(true) as HTMLElement;
        preview.className = "movie-card movie-drag-preview";
        preview.removeAttribute("tabindex");
        preview.style.width = `${bounds.width}px`;
        preview.style.height = `${bounds.height}px`;
        preview.style.viewTransitionName = "none";
        document.body.appendChild(preview);
        event.dataTransfer.setDragImage(preview, bounds.width / 2, 34);
        window.setTimeout(() => preview.remove(), 0);
        onDragStart?.(movie.id, event);
      }}
      onDragEnter={() => onDragEnter?.(movie.id)}
      onDragOver={(event) => {
        if (manualOrder) event.preventDefault();
      }}
      onDrop={(event) => onDrop?.(movie.id, event)}
      onDragEnd={onDragEnd}
    >
      <MovieImage src={poster} alt={`Capa de ${movie.title}`} title={movie.title} sizes="(max-width: 520px) 33vw, (max-width: 900px) 25vw, 13vw" />
      {manualOrder && onMove ? (
        <div className="card-order-controls" onClick={(event) => event.stopPropagation()}>
          <button type="button" disabled={!canMoveBackward} aria-label={`Mover ${movie.title} para trás`} title="Mover para trás" onClick={() => onMove(movie.id, -1)}>
            <ChevronLeft size={15} />
          </button>
          <span title="Arraste para reordenar"><GripVertical size={15} /></span>
          <button type="button" disabled={!canMoveForward} aria-label={`Mover ${movie.title} para frente`} title="Mover para frente" onClick={() => onMove(movie.id, 1)}>
            <ChevronRight size={15} />
          </button>
        </div>
      ) : null}
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
