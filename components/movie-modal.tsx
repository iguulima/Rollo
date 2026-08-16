"use client";

import Image from "next/image";
import { ExternalLink, LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { MovieDetails, MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";

type MovieModalProps = {
  movie: MovieSummary;
  inWatchlist: boolean;
  onClose: () => void;
  onRemove: (movieId: number) => void;
};

function formatRuntime(runtime: number | null) {
  if (!runtime) return null;
  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

export function MovieModal({ movie, inWatchlist, onClose, onRemove }: MovieModalProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.body.classList.add("modal-open");
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      controller.abort();
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [movie.id, onClose]);

  const poster = tmdbImage(movie.posterPath, "w500");

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="movie-title">
      <button className="modal-scrim" type="button" aria-label="Fechar" onClick={onClose} />
      <section className="modal-panel">
        <button className="modal-close" type="button" aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-poster">
          {poster ? <Image src={poster} alt={`Capa de ${movie.title}`} fill sizes="340px" priority /> : null}
        </div>
        <div className="modal-copy">
          <p className="modal-kicker">{details?.genres.join(" · ") || "FILME"}</p>
          <h2 id="movie-title">{movie.title}</h2>
          <div className="movie-meta">
            <strong>★ {movie.rating.toFixed(1)}</strong>
            <span>{movie.releaseYear}</span>
            {details?.runtime ? <span>{formatRuntime(details.runtime)}</span> : null}
          </div>
          <p className="overview">{details?.overview || movie.overview || "Sinopse ainda não disponível em português."}</p>

          {!details && !failed ? (
            <div className="details-loading"><LoaderCircle size={17} className="spin-icon" /> Buscando detalhes</div>
          ) : null}
          {failed ? <p className="details-error">Não foi possível carregar os dados complementares.</p> : null}

          {details?.director ? (
            <div className="credit-row"><span>Direção</span><b>{details.director}</b></div>
          ) : null}
          {details?.cast.length ? (
            <div className="credit-row"><span>Elenco</span><b>{details.cast.join(" · ")}</b></div>
          ) : null}

          {details?.providers.length ? (
            <section className="providers">
              <p>Onde assistir</p>
              <div>
                {details.providers.map((provider) => (
                  <figure key={provider.id} title={provider.name}>
                    {provider.logoPath ? (
                      <Image src={tmdbImage(provider.logoPath, "w342")!} alt={provider.name} width={42} height={42} />
                    ) : null}
                    <figcaption>{provider.name}</figcaption>
                  </figure>
                ))}
              </div>
              <small>Disponibilidade fornecida por JustWatch via TMDB.</small>
            </section>
          ) : details ? <p className="no-providers">Nenhum streaming encontrado no Brasil.</p> : null}

          <div className="modal-actions">
            <a href={`https://letterboxd.com/tmdb/${movie.id}`} target="_blank" rel="noreferrer" className="letterboxd-link">
              Ver no Letterboxd <ExternalLink size={15} />
            </a>
            {inWatchlist ? (
              <button className="remove-button" type="button" onClick={() => { onRemove(movie.id); onClose(); }}>
                <Trash2 size={15} /> Remover
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
