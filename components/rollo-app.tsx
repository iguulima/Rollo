"use client";

import { Dices, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { useWatchlist } from "@/features/watchlist/use-watchlist";
import { MovieCard } from "./movie-card";
import { MovieModal } from "./movie-modal";
import { Roulette } from "./roulette";

type SearchResponse = { results?: MovieSummary[]; error?: string };

export function RolloApp() {
  const watchlist = useWatchlist();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MovieSummary | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

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
  }, [query]);

  const visibleMovies = query.trim().length >= 2 ? results : watchlist.movies;
  const isSearch = query.trim().length >= 2;

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

      <div className="search-field">
        <Search size={20} />
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim().length < 2) {
              setResults([]);
              setSearching(false);
              setSearchError(null);
            }
          }}
          placeholder="Buscar filmes para adicionar..."
          aria-label="Buscar filmes"
        />
        {query ? <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(""); setResults([]); setSearchError(null); }}><X size={17} /></button> : <kbd>ESC</kbd>}
      </div>

      <div className="list-meta">
        <span>{isSearch ? `${visibleMovies.length} resultados` : `${watchlist.movies.length} filmes na sua watchlist`}</span>
        <small>{isSearch ? "Use + para adicionar" : "Todos participam do sorteio"}</small>
      </div>

      {searching ? <div className="grid-status">Buscando na TMDB...</div> : null}
      {searchError ? <div className="grid-status error">{searchError}</div> : null}
      {!searching && !searchError && watchlist.ready && !visibleMovies.length ? (
        <div className="empty-state">
          <h2>{isSearch ? "Nenhum filme encontrado" : "Sua watchlist está vazia"}</h2>
          <p>{isSearch ? "Tente buscar por outro título." : "Use a busca acima para adicionar seu primeiro filme."}</p>
        </div>
      ) : null}

      <section className="movie-grid" aria-live="polite">
        {visibleMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            canAdd={isSearch && !watchlist.has(movie.id)}
            onOpen={setSelected}
            onAdd={async (item) => { await watchlist.add(item); showNotice("Adicionado à watchlist"); }}
          />
        ))}
      </section>

      <footer>Dados e imagens fornecidos por TMDB.</footer>

      {selected ? (
        <MovieModal
          movie={selected}
          inWatchlist={watchlist.has(selected.id)}
          onClose={() => setSelected(null)}
          onRemove={async (id) => { await watchlist.remove(id); showNotice("Removido da watchlist"); }}
        />
      ) : null}
      {rouletteOpen ? <Roulette movies={watchlist.movies} onClose={() => setRouletteOpen(false)} /> : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
