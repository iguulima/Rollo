"use client";

import { AlertCircle, ArrowDownAZ, Bookmark, CalendarDays, Check, CheckCircle2, Dices, ExternalLink, Eye, GripVertical, LoaderCircle, Play, Plus, Search, Star, Trash2, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { MovieSummary } from "@/lib/movies/types";
import { tmdbImage } from "@/lib/movies/types";
import { useWatchlist } from "@/features/watchlist/use-watchlist";
import { useWatched } from "@/features/watched/use-watched";
import { MovieCard } from "./movie-card";
import { MovieImage } from "./movie-image";
import { MovieModal } from "./movie-modal";
import { Roulette } from "./roulette";
import { TrailerModal } from "./trailer-modal";

type SearchResponse = { results?: MovieSummary[]; error?: string };
type SortMode = "manual" | "title" | "year" | "rating";
type CollectionView = "watchlist" | "watched";
type ContextMenuState = { movie: MovieSummary; x: number; y: number };

export function RolloApp() {
  const watchlist = useWatchlist();
  const watched = useWatched();
  const [activeView, setActiveView] = useState<CollectionView>("watchlist");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [selected, setSelected] = useState<MovieSummary | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<MovieSummary | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [rouletteOpen, setRouletteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const noticeTimer = useRef<number | null>(null);
  const [draggedMovieId, setDraggedMovieId] = useState<number | null>(null);
  const [dragOverMovieId, setDragOverMovieId] = useState<number | null>(null);
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

  const collectionMovies = activeView === "watchlist" ? watchlist.movies : watched.movies;
  const collectionReady = activeView === "watchlist" ? watchlist.ready : watched.ready;

  const visibleMovies = useMemo(() => {
    const movies = [...collectionMovies];
    if (sortMode === "title") return movies.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    if (sortMode === "year") return movies.sort((a, b) => Number(b.releaseYear || 0) - Number(a.releaseYear || 0));
    if (sortMode === "rating") return movies.sort((a, b) => b.rating - a.rating);
    return movies;
  }, [collectionMovies, sortMode]);

  const changeSort = (mode: SortMode) => {
    setSortMode(mode);
  };

  const reorderWithTransition = async (movieIds: number[]) => {
    const startViewTransition = (document as Document & {
      startViewTransition?: (callback: () => Promise<void>) => { finished: Promise<void> };
    }).startViewTransition;
    if (!startViewTransition) {
      await watchlist.reorder(movieIds);
      return;
    }
    await startViewTransition.call(document, () => watchlist.reorder(movieIds)).finished;
  };

  const moveMovie = async (movieId: number, direction: -1 | 1) => {
    const ids = watchlist.movies.map((item) => item.id);
    const currentIndex = ids.indexOf(movieId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
    [ids[currentIndex], ids[nextIndex]] = [ids[nextIndex], ids[currentIndex]];
    await reorderWithTransition(ids);
  };

  const dropMovie = async (targetId: number) => {
    const sourceId = draggedMovieId;
    setDraggedMovieId(null);
    setDragOverMovieId(null);
    document.body.classList.remove("dragging-watchlist");
    if (sourceId === null || sourceId === targetId) return;
    const ids = watchlist.movies.map((item) => item.id);
    const sourceIndex = ids.indexOf(sourceId);
    const targetIndex = ids.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    ids.splice(sourceIndex, 1);
    ids.splice(targetIndex, 0, sourceId);
    await reorderWithTransition(ids);
  };

  const closeRoulette = useCallback(() => setRouletteOpen(false), []);
  const openMovie = useCallback((movie: MovieSummary) => {
    setSelected(movie);
    setContextMenu(null);
  }, []);
  const openRouletteMovie = useCallback((movie: MovieSummary) => openMovie(movie), [openMovie]);

  const markAsWatched = useCallback(async (movie: MovieSummary) => {
    await watched.add(movie);
    await watchlist.remove(movie.id);
    showNotice("Movido para Assistidos");
  }, [showNotice, watched, watchlist]);

  const addToWatchlist = useCallback(async (movie: MovieSummary) => {
    await watchlist.add(movie);
    await watched.remove(movie.id);
    showNotice("Adicionado à watchlist");
  }, [showNotice, watched, watchlist]);

  const markRouletteWinner = useCallback((movie: MovieSummary) => {
    setRouletteOpen(false);
    void markAsWatched(movie);
  }, [markAsWatched]);

  const openContextMenu = useCallback((movie: MovieSummary, event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX || bounds.left + bounds.width / 2;
    const pointerY = event.clientY || bounds.top + bounds.height / 2;
    setContextMenu({
      movie,
      x: Math.max(8, Math.min(pointerX, window.innerWidth - 236)),
      y: Math.max(8, Math.min(pointerY, window.innerHeight - 290)),
    });
  }, []);

  const isSearch = query.trim().length >= 2 && searchOpen;

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p>COLEÇÃO PESSOAL</p>
          <h1>Rollo</h1>
          <span>Sua próxima sessão começa aqui.</span>
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
          {query ? <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(""); setResults([]); setSearchError(null); setSearchOpen(false); }}><X size={17} /></button> : null}
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
                        openMovie(movie);
                        setSearchOpen(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          openMovie(movie);
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
                            await addToWatchlist(movie);
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

      <nav className="collection-tabs" aria-label="Coleções de filmes">
        <button className={activeView === "watchlist" ? "active" : ""} type="button" aria-current={activeView === "watchlist" ? "page" : undefined} onClick={() => { setActiveView("watchlist"); setContextMenu(null); }}>
          <Bookmark size={15} /> Watchlist <span>{watchlist.movies.length}</span>
        </button>
        <button className={activeView === "watched" ? "active" : ""} type="button" aria-current={activeView === "watched" ? "page" : undefined} onClick={() => { setActiveView("watched"); setContextMenu(null); }}>
          <CheckCircle2 size={15} /> Assistidos <span>{watched.movies.length}</span>
        </button>
      </nav>

      <div className="list-meta">
        <span>{collectionMovies.length} {collectionMovies.length === 1 ? "filme" : "filmes"} em {activeView === "watchlist" ? "Watchlist" : "Assistidos"}</span>
        <div className="sort-control" role="group" aria-label="Ordenar watchlist">
          <span>Ordenar por</span>
          <div className="sort-segments">
            <button className={sortMode === "manual" ? "active" : ""} type="button" aria-pressed={sortMode === "manual"} onClick={() => changeSort("manual")} title="Minha ordem">
              <GripVertical size={13} /> <span>Manual</span>
            </button>
            <button className={sortMode === "title" ? "active" : ""} type="button" aria-pressed={sortMode === "title"} onClick={() => changeSort("title")} title="Ordenar por título">
              <ArrowDownAZ size={13} /> <span>Título</span>
            </button>
            <button className={sortMode === "year" ? "active" : ""} type="button" aria-pressed={sortMode === "year"} onClick={() => changeSort("year")} title="Ordenar por ano">
              <CalendarDays size={13} /> <span>Ano</span>
            </button>
            <button className={sortMode === "rating" ? "active" : ""} type="button" aria-pressed={sortMode === "rating"} onClick={() => changeSort("rating")} title="Ordenar por nota">
              <Star size={13} /> <span>Nota</span>
            </button>
          </div>
        </div>
      </div>

      {collectionReady && !collectionMovies.length ? (
        <div className="empty-state">
          <h2>{activeView === "watchlist" ? "Sua watchlist está vazia" : "Nenhum filme assistido"}</h2>
          <p>{activeView === "watchlist" ? "Use a busca acima para adicionar seu primeiro filme." : "Os filmes marcados como assistidos aparecerão aqui."}</p>
        </div>
      ) : null}

      <section className="movie-grid" aria-live="polite">
        {visibleMovies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onOpen={(item) => openMovie(item)}
            onContextMenu={openContextMenu}
            manualOrder={activeView === "watchlist" && sortMode === "manual"}
            dragging={draggedMovieId === movie.id}
            dropTarget={dragOverMovieId === movie.id && draggedMovieId !== movie.id}
            canMoveBackward={activeView === "watchlist" && index > 0}
            canMoveForward={activeView === "watchlist" && index < visibleMovies.length - 1}
            onMove={moveMovie}
            onDragStart={(movieId, event) => {
              setDraggedMovieId(movieId);
              setDragOverMovieId(movieId);
              document.body.classList.add("dragging-watchlist");
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(movieId));
            }}
            onDragEnter={setDragOverMovieId}
            onDrop={(movieId, event) => {
              event.preventDefault();
              void dropMovie(movieId);
            }}
            onDragEnd={() => {
              setDraggedMovieId(null);
              setDragOverMovieId(null);
              document.body.classList.remove("dragging-watchlist");
            }}
          />
        ))}
      </section>

      <footer>Dados e imagens fornecidos por TMDB.</footer>

      {contextMenu ? (
        <>
          <button className="context-menu-scrim" type="button" aria-label="Fechar menu" onClick={() => setContextMenu(null)} />
          <div className="movie-context-menu" role="menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <header><span>{contextMenu.movie.title}</span><small>{contextMenu.movie.releaseYear}</small></header>
            <button type="button" role="menuitem" onClick={() => openMovie(contextMenu.movie)}><Eye size={15} /> Ver detalhes</button>
            <button type="button" role="menuitem" onClick={() => { setTrailerMovie(contextMenu.movie); setContextMenu(null); }}><Play size={15} /> Assistir trailer</button>
            <a href={`https://letterboxd.com/tmdb/${contextMenu.movie.id}`} target="_blank" rel="noreferrer" role="menuitem" onClick={() => setContextMenu(null)}>
              <ExternalLink size={15} /> Abrir no Letterboxd
            </a>
            <div className="movie-context-separator" />
            {watchlist.has(contextMenu.movie.id) ? (
              <button type="button" role="menuitem" onClick={() => { const movie = contextMenu.movie; setContextMenu(null); void markAsWatched(movie); }}>
                <CheckCircle2 size={15} /> Marcar como assistido
              </button>
            ) : (
              <button type="button" role="menuitem" onClick={() => { const movie = contextMenu.movie; setContextMenu(null); void addToWatchlist(movie); }}>
                <Undo2 size={15} /> Voltar à watchlist
              </button>
            )}
            <button className="danger" type="button" role="menuitem" onClick={() => {
              const movie = contextMenu.movie;
              const isInWatchlist = watchlist.has(movie.id);
              setContextMenu(null);
              void (isInWatchlist ? watchlist.remove(movie.id) : watched.remove(movie.id));
              showNotice(isInWatchlist ? "Removido da watchlist" : "Removido dos assistidos");
            }}>
              <Trash2 size={15} /> Remover da coleção
            </button>
          </div>
        </>
      ) : null}

      {selected ? (
        <MovieModal
          key={selected.id}
          movie={selected}
          inWatchlist={watchlist.has(selected.id)}
          onClose={() => setSelected(null)}
          onAdd={addToWatchlist}
          onRemove={async (id) => { await watchlist.remove(id); showNotice("Removido da watchlist"); }}
        />
      ) : null}
      {trailerMovie ? <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} /> : null}
      {rouletteOpen ? (
        <Roulette
          movies={watchlist.movies}
          onClose={closeRoulette}
          onSelect={openRouletteMovie}
          onMarkWatched={markRouletteWinner}
        />
      ) : null}
      {notice ? <div className="toast">{notice}</div> : null}
    </main>
  );
}
