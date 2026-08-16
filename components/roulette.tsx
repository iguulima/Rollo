"use client";

import { ArrowLeft, Dices, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { MovieImage } from "./movie-image";

type RouletteProps = {
  movies: MovieSummary[];
  onClose: () => void;
};

function choose<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function Roulette({ movies, onClose }: RouletteProps) {
  const [phase, setPhase] = useState<"spinning" | "result">("spinning");
  const [sequence, setSequence] = useState<MovieSummary[]>([movies[0]]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [moving, setMoving] = useState(false);
  const [duration, setDuration] = useState(2400);
  const lastWinner = useRef<number | null>(null);
  const runId = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();
    runId.current += 1;
    const currentRun = runId.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spinDuration = reducedMotion ? 420 : 2400;
    const leadCards = reducedMotion ? 2 : 6;
    const travelCards = reducedMotion ? 4 : 20;
    const tailCards = reducedMotion ? 3 : 9;
    const winnerIndex = leadCards + travelCards;
    const sequenceLength = winnerIndex + tailCards + 1;
    const winnerPool = movies.filter((movie) => movie.id !== lastWinner.current);
    const winner = choose(winnerPool.length ? winnerPool : movies);
    const reel: MovieSummary[] = [];

    while (reel.length < sequenceLength) {
      const alternatives = movies.filter((movie) => movie.id !== reel.at(-1)?.id);
      reel.push(choose(alternatives.length ? alternatives : movies));
    }
    reel[winnerIndex] = winner;
    if (movies.length > 1 && reel[winnerIndex - 1]?.id === winner.id) {
      reel[winnerIndex - 1] = choose(movies.filter((movie) => movie.id !== winner.id));
    }
    if (movies.length > 1 && reel[winnerIndex + 1]?.id === winner.id) {
      reel[winnerIndex + 1] = choose(movies.filter((movie) => movie.id !== winner.id));
    }

    const mobile = window.innerWidth <= 620;
    const cardWidth = mobile ? 150 : 210;
    const gap = mobile ? 12 : 18;
    const centerOffset = window.innerWidth / 2 - cardWidth / 2;
    const initialOffset = centerOffset - leadCards * (cardWidth + gap);
    const finalOffset = centerOffset - winnerIndex * (cardWidth + gap);

    setDuration(spinDuration);
    setSequence(reel);
    setTargetIndex(winnerIndex);
    setPhase("spinning");
    setMoving(false);
    setOffset(initialOffset);

    const launch = window.setTimeout(() => {
      if (runId.current !== currentRun) return;
      setMoving(true);
      setOffset(finalOffset);
    }, 40);
    const finish = window.setTimeout(() => {
      if (runId.current !== currentRun) return;
      lastWinner.current = winner.id;
      setPhase("result");
    }, spinDuration + 100);
    timers.current.push(launch, finish);
  }, [clearTimers, movies]);

  useEffect(() => {
    const initialSpin = window.setTimeout(start, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(initialSpin);
      clearTimers();
      runId.current += 1;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [clearTimers, onClose, start]);

  const winner = sequence[targetIndex] ?? movies[0];
  const winnerBackdrop = phase === "result" ? tmdbImage(winner.backdropPath, "original") : null;
  const rouletteStyle = {
    "--winner-backdrop": winnerBackdrop ? `url(${winnerBackdrop})` : "none",
  } as CSSProperties;
  const trackStyle = {
    transform: `translate3d(${offset}px, 0, 0)`,
    transitionDuration: moving ? `${duration}ms` : "0ms",
  };

  return (
    <div className={`roulette ${phase}`} style={rouletteStyle}>
      <div className="roulette-background" />
      <button className="roulette-back" type="button" onClick={onClose}>
        <ArrowLeft size={17} /> Voltar à watchlist
      </button>

      <header className="roulette-header">
        <span><Dices size={15} /> SORTEIO</span>
        <p>{phase === "spinning" ? `${movies.length} filmes participando` : "O acaso escolheu"}</p>
      </header>

      <section className="roulette-reel-window" aria-live="polite">
        <div className="roulette-track" style={trackStyle}>
          {sequence.map((movie, index) => {
            const poster = tmdbImage(movie.posterPath, "w500");
            const isWinner = index === targetIndex;
            return (
              <div className={`reel-card ${isWinner ? "winner-card" : ""}`} key={`${movie.id}-${index}`}>
                <MovieImage src={poster} alt={`Capa de ${movie.title}`} title={movie.title} sizes="210px" />
              </div>
            );
          })}
        </div>
        <div className="roulette-focus" aria-hidden="true"><i /><i /></div>
        {phase === "spinning" ? <div className="roulette-progress" style={{ animationDuration: `${duration}ms` }} /> : null}
      </section>

      {phase === "result" ? (
        <div className="roulette-result-copy">
          <h1>{winner.title}</h1>
          <span>{winner.releaseYear} · ★ {winner.rating.toFixed(1)}</span>
        </div>
      ) : <div className="roulette-result-placeholder" aria-hidden="true" />}

      {phase === "result" ? (
        <div className="roulette-actions">
          <button className="primary-button" type="button" onClick={start}><RotateCcw size={17} /> Sortear novamente</button>
          <a href={`https://letterboxd.com/tmdb/${winner.id}`} target="_blank" rel="noreferrer">Abrir no Letterboxd</a>
        </div>
      ) : null}
    </div>
  );
}
