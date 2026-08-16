"use client";

import Image from "next/image";
import { ArrowLeft, Dices, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";

type RouletteProps = {
  movies: MovieSummary[];
  onClose: () => void;
};

export function Roulette({ movies, onClose }: RouletteProps) {
  const [phase, setPhase] = useState<"spinning" | "result">("spinning");
  const [displayed, setDisplayed] = useState(movies[0]);
  const lastWinner = useRef<number | null>(null);
  const runId = useRef(0);

  const start = useCallback(() => {
    runId.current += 1;
    const currentRun = runId.current;
    setPhase("spinning");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? 450 : 2800;
    const startedAt = performance.now();

    const tick = () => {
      if (runId.current !== currentRun) return;
      const elapsed = performance.now() - startedAt;
      const candidates = movies.filter((movie) => movie.id !== lastWinner.current);
      const pool = candidates.length ? candidates : movies;
      setDisplayed(pool[Math.floor(Math.random() * pool.length)]);

      if (elapsed >= duration) {
        const winner = pool[Math.floor(Math.random() * pool.length)];
        lastWinner.current = winner.id;
        setDisplayed(winner);
        setPhase("result");
        return;
      }
      const progress = elapsed / duration;
      window.setTimeout(tick, reducedMotion ? 180 : 55 + progress * progress * 260);
    };
    tick();
  }, [movies]);

  useEffect(() => {
    const initialSpin = window.setTimeout(start, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(initialSpin);
      runId.current += 1;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, start]);

  const poster = tmdbImage(displayed.posterPath, "w500");

  return (
    <div className={`roulette ${phase}`}>
      <button className="roulette-back" type="button" onClick={onClose}>
        <ArrowLeft size={17} /> Voltar à watchlist
      </button>
      <div className="roulette-stage">
        <p>{phase === "spinning" ? `SORTEANDO ENTRE ${movies.length} FILMES` : "O FILME SORTEADO FOI"}</p>
        <div className="roulette-poster">
          {poster ? <Image key={displayed.id} src={poster} alt={displayed.title} fill sizes="280px" priority /> : null}
        </div>
        <div className="roulette-title">
          <h1>{phase === "spinning" ? "Escolhendo..." : displayed.title}</h1>
          {phase === "result" ? <span>{displayed.releaseYear} · ★ {displayed.rating.toFixed(1)}</span> : null}
        </div>
        {phase === "result" ? (
          <div className="roulette-actions">
            <button className="primary-button" type="button" onClick={start}><RotateCcw size={17} /> Sortear novamente</button>
            <a href={`https://letterboxd.com/tmdb/${displayed.id}`} target="_blank" rel="noreferrer">Abrir no Letterboxd</a>
          </div>
        ) : <Dices className="roulette-dice" size={22} />}
      </div>
    </div>
  );
}
