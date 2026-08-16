"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { MovieDetails, MovieSummary } from "@/lib/movies/types";

type TrailerModalProps = {
  movie: MovieSummary;
  onClose: () => void;
};

export function TrailerModal({ movie, onClose }: TrailerModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.body.classList.add("modal-open");
    const controller = new AbortController();
    fetch(`/api/tmdb/movies/${movie.id}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("trailer unavailable");
        return response.json() as Promise<MovieDetails>;
      })
      .then((details) => {
        setTrailerKey(details.trailerKey);
        setFailed(!details.trailerKey);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setFailed(true);
      })
      .finally(() => setLoading(false));

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

  return (
    <div className="standalone-trailer" role="dialog" aria-modal="true" aria-label={`Trailer de ${movie.title}`}>
      <button className="standalone-trailer-scrim" type="button" aria-label="Fechar trailer" onClick={onClose} />
      <section className="standalone-trailer-player">
        {loading ? (
          <div className="standalone-trailer-status"><LoaderCircle className="spin-icon" size={24} /><span>Carregando trailer</span></div>
        ) : failed || !trailerKey ? (
          <div className="standalone-trailer-status error"><AlertCircle size={24} /><span>Trailer não disponível para este filme.</span></div>
        ) : (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&playsinline=1&vq=hd720`}
            title={`Trailer de ${movie.title}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </section>
    </div>
  );
}
