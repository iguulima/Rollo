"use client";

import Image from "next/image";
import { AlertCircle, LoaderCircle, Play, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { MovieDetails, MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { MovieImage } from "./movie-image";

type MovieModalProps = {
  movie: MovieSummary;
  inWatchlist: boolean;
  onClose: () => void;
  onAdd: (movie: MovieSummary) => Promise<void> | void;
  onRemove: (movieId: number) => void;
};

function formatRuntime(runtime: number | null) {
  if (!runtime) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

export function MovieModal({ movie, inWatchlist, onClose, onAdd, onRemove }: MovieModalProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [failed, setFailed] = useState(false);
  const [detailsAttempt, setDetailsAttempt] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tmdb/movies/${movie.id}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("details unavailable");
        return response.json() as Promise<MovieDetails>;
      })
      .then(setDetails)
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed(true);
      });

    return () => controller.abort();
  }, [detailsAttempt, movie.id]);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (trailerOpen) setTrailerOpen(false);
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, trailerOpen]);

  const poster = tmdbImage(movie.posterPath, "w500");
  const backdrop = tmdbImage(details?.backdropPath ?? movie.backdropPath, "original");

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="movie-title">
      <button className="modal-scrim" type="button" aria-label="Fechar" onClick={onClose} />
      <section className="movie-dialog">
        <button className="movie-dialog-close" type="button" aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </button>

        <aside className="movie-dialog-hero">
          <div className="movie-dialog-backdrop">
            <MovieImage src={backdrop} alt={`Imagem de fundo de ${movie.title}`} sizes="(max-width: 700px) 100vw, 920px" priority variant="backdrop" />
          </div>
          <div className="movie-dialog-shade" />
          <div className="movie-dialog-poster">
            <MovieImage src={poster} alt={`Capa de ${movie.title}`} title={movie.title} sizes="(max-width: 700px) 120px, 220px" priority />
          </div>
          {inWatchlist ? <span className="movie-dialog-watchlist-status">Na sua watchlist</span> : null}
        </aside>

        <div className="movie-dialog-body">
          <header className="movie-dialog-heading">
            <p>{details?.genres.join(" · ") || "FILME"}</p>
            <h2 id="movie-title">{movie.title}</h2>
            {movie.originalTitle !== movie.title ? <span>{movie.originalTitle}</span> : null}
            <div className="movie-dialog-meta">
              <strong>★ {movie.rating.toFixed(1)}</strong>
              <span>{movie.releaseYear}</span>
              {details?.runtime ? <span>{formatRuntime(details.runtime)}</span> : null}
            </div>
          </header>

          <section className="movie-dialog-details">
            <div className="movie-dialog-description">
              <h3>Sinopse</h3>
              <p className="movie-dialog-overview">{details?.overview || movie.overview || "Sinopse ainda não disponível em português."}</p>

              {!details && !failed ? (
                <div className="movie-dialog-loading"><LoaderCircle size={17} className="spin-icon" /> Buscando detalhes</div>
              ) : null}
              {failed ? (
                <div className="movie-dialog-error">
                  <AlertCircle size={17} />
                  <span>Não foi possível carregar os detalhes.</span>
                  <button type="button" onClick={() => { setFailed(false); setDetails(null); setDetailsAttempt((attempt) => attempt + 1); }}>
                    <RefreshCw size={14} /> Tentar novamente
                  </button>
                </div>
              ) : null}
            </div>

            <div className="movie-dialog-credits">
              <h3>Ficha técnica</h3>
              {details?.director ? <div><span>Direção</span><b>{details.director}</b></div> : null}
              {details?.cast.length ? <div><span>Elenco principal</span><b>{details.cast.join(" · ")}</b></div> : null}
            </div>

            <div className="movie-dialog-providers">
              <div className="movie-dialog-providers-heading">
                <h3>Onde assistir</h3>
                <small>Brasil</small>
              </div>
              {details?.providers.length ? (
                <>
                  <div className="movie-dialog-provider-list">
                    {details.providers.map((provider) => (
                      <figure key={provider.id} tabIndex={0} aria-label={provider.name}>
                        {provider.logoPath ? <Image src={tmdbImage(provider.logoPath, "w342")!} alt="" width={38} height={38} /> : null}
                        <figcaption>{provider.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                  <small className="movie-dialog-provider-attribution">Dados por JustWatch via TMDB.</small>
                </>
              ) : details ? <p>Nenhum streaming encontrado.</p> : <div className="movie-dialog-provider-skeleton" />}
            </div>
          </section>

          <div className="movie-dialog-actions">
            {details?.trailerKey ? (
              <button className="trailer-button" type="button" onClick={() => setTrailerOpen(true)}>
                <Play size={15} fill="currentColor" /> Assistir trailer
              </button>
            ) : null}
            <a href={`https://letterboxd.com/tmdb/${movie.id}`} target="_blank" rel="noreferrer" className="letterboxd-link">
              <Image className="letterboxd-official-icon" src="/letterboxd-dots.svg" alt="" width={20} height={20} />
              Ver no Letterboxd
            </a>
            {inWatchlist ? (
              <button className="remove-button" type="button" onClick={() => onRemove(movie.id)}>
                <Trash2 size={15} /> Remover da watchlist
              </button>
            ) : (
              <button className="add-watchlist-button" type="button" onClick={() => onAdd(movie)}>
                <Plus size={16} /> Adicionar à watchlist
              </button>
            )}
          </div>
        </div>

        {trailerOpen && details?.trailerKey ? (
          <div className="trailer-layer" role="dialog" aria-modal="true" aria-label={`Trailer de ${movie.title}`}>
            <button className="trailer-layer-scrim" type="button" aria-label="Fechar trailer" onClick={() => setTrailerOpen(false)} />
            <div className="trailer-player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${details.trailerKey}?autoplay=1&rel=0&playsinline=1&vq=hd720`}
                title={`Trailer de ${movie.title}`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
