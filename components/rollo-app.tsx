"use client";

import { AlertCircle, Check, Dices, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { useWatchlist } from "@/features/watchlist/use-watchlist";
import { MovieCard } from "./movie-card";
import { MovieImage } from "./movie-image";
import { MovieModal } from "./movie-modal";
import { Roulette } from "./roulette";

type SearchResponse = { results?: MovieSummary[]; error?: string };

export function RolloApp() {
  const watchlist = useWatchlist();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [selected, setSelected] = useState<MovieSummary | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const searchAreaRef = useRef<HTMLDivElement | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = await response.json() as SearchResponse;
        if (!response.ok) {
          setSearchError(data.error === "TMDB_NOT_CONFIGURED"
            ? "Configure TMDB_READ_ACCESS_TOKEN em .env.local para pesquisar."
            : "A busca está indisponível no momento.");
          setResults([]);
        } else {
          setResults(data.results ?? []);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSearchError("Não foi possível concluir a busca.");
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, searchAttempt]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const isSearch = query.trim().length >= 2 && searchOpen;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p>ROLLO · COLEÇÃO PESSOAL</p>
          <h1>Minha watchlist</h1>
          <span>Escolha um filme ou deixe o acaso decidir.</span>
        </div>
        <button className="primary-button roulette-button" type="button" disabled={!watchlist.movies.length} onClick={() => setRouletteOpen(true)}>
          <Dices size={18} /> Sortear entre {watchlist.movies.length}
        </button>
      </header>

      <div className="search-area" ref={searchAreaRef}>
        <div className="search-field">
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              setSearchOpen(value.trim().length >= 2);
              if (value.trim().length < 2) {
                setResults([]);
                setSearching(false);
                setSearchError(null);
              }
            }}
            placeholder="Buscar filmes para adicionar..."
            aria-label="Buscar filmes"
            autoComplete="off"
            onFocus={() => {
              if (query.trim().length >= 2) setSearchOpen(true);
            }}
          />
          {query ? <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(""); setResults([]); setSearchError(null); setSearchOpen(false); }}><X size={17} /></button> : <kbd>ESC</kbd>}
        </div>

        {isSearch ? (
          <section className="search-dropdown" aria-label="Resultados da busca">
            <header>
              <span>{searching ? "Buscando na TMDB" : `${results.length} resultados`}</span>
              <small>Clique para ver detalhes</small>
            </header>
            {searching ? (
              <div className="search-message"><LoaderCircle size={18} className="spin-icon" /> Buscando filmes</div>
            ) : searchError ? (
              <div className="search-message error">
                <AlertCircle size={18} />
                <span>{searchError}</span>
                <button type="button" onClick={() => setSearchAttempt((attempt) => attempt + 1)}>Tentar novamente</button>
              </div>
            ) : results.length ? (
              <div className="search-options">
                {results.map((movie) => {
                  const poster = tmdbImage(movie.posterPath, "w342");
                  const alreadySaved = watchlist.has(movie.id);
                  return (
                    <article
                      className="search-option"
                      key={movie.id}
                      tabIndex={0}
                      onClick={() => {
                        setSelected(movie);
                        setSearchOpen(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          setSelected(movie);
                          setSearchOpen(false);
                        }
                      }}
                    >
                      <div className="search-add-slot">
                        <button
                          className={alreadySaved ? "saved" : ""}
                          type="button"
                          aria-label={alreadySaved ? `${movie.title} já está na watchlist` : `Adicionar ${movie.title} à watchlist`}
                          title={alreadySaved ? "Na watchlist" : "Adicionar à watchlist"}
                          disabled={alreadySaved}
                          onClick={async (event) => {
                            event.stopPropagation();
                            if (alreadySaved) return;
                            await watchlist.add(movie);
                            showNotice("Adicionado à watchlist");
                          }}
                        >
                          {alreadySaved ? <Check size={17} /> : <Plus size={17} />}
                        </button>
                      </div>
                      <div className="search-poster">
                        <MovieImage src={poster} alt={`Capa de ${movie.title}`} title={movie.title} sizes="48px" />
                      </div>
                      <div className="search-option-copy">
                        <h3>{movie.title}</h3>
                        {movie.originalTitle !== movie.title ? <p className="search-original">{movie.originalTitle}</p> : null}
                        <dl>
                          <div><dt>Ano</dt><dd>{movie.releaseYear || "—"}</dd></div>
                          <div><dt>Nota</dt><dd>★ {movie.rating.toFixed(1)}</dd></div>
                        </dl>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="search-message">Nenhum filme encontrado.</div>
            )}
          </section>
        ) : null}
      </div>

      <div className="list-meta">
        <span>{watchlist.movies.length} filmes na sua watchlist</span>
        <small>Todos participam do sorteio</small>
      </div>

      {watchlist.ready && !watchlist.movies.length ? (
        <div className="empty-state">
          <h2>Sua watchlist está vazia</h2>
          <p>Use a busca acima para adicionar seu primeiro filme.</p>
        </div>
      ) : null}

      <section className="movie-grid" aria-live="polite">
        {watchlist.movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onOpen={setSelected}
          />
        ))}
      </section>

      <footer>Dados e imagens fornecidos por TMDB.</footer>

      {selected ? (
        <MovieModal
          movie={selected}
          inWatchlist={watchlist.has(selected.id)}
          onClose={() => setSelected(null)}
          onAdd={async (movie) => { await watchlist.add(movie); showNotice("Adicionado à watchlist"); }}
          onRemove={async (id) => { await watchlist.remove(id); showNotice("Removido da watchlist"); }}
        />
      ) : null}
      {rouletteOpen ? <Roulette movies={watchlist.movies} onClose={() => setRouletteOpen(false)} /> : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
