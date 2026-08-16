import "server-only";
import type { MovieDetails, MovieSummary, WatchProvider } from "@/lib/movies/types";

const TMDB_URL = "https://api.themoviedb.org/3";

type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
};

type TmdbCredits = {
  crew: Array<{ job: string; name: string }>;
  cast: Array<{ name: string; order: number }>;
};

type TmdbProviders = {
  results: Record<string, {
    link?: string;
    flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string | null }>;
  }>;
};

export class TmdbConfigurationError extends Error {}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) throw new TmdbConfigurationError("TMDB_READ_ACCESS_TOKEN is not configured");

  const url = new URL(`${TMDB_URL}${path}`);
  url.searchParams.set("language", "pt-BR");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error(`TMDB request failed with status ${response.status}`);
  return response.json() as Promise<T>;
}

function toSummary(movie: TmdbMovie): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.original_title,
    releaseYear: movie.release_date?.slice(0, 4) ?? "",
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    overview: movie.overview,
    rating: Math.round((movie.vote_average || 0) * 10) / 10,
  };
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>("/search/movie", {
    query,
    include_adult: "false",
    region: "BR",
  });
  return data.results.filter((movie) => movie.poster_path).slice(0, 20).map(toSummary);
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const [movie, credits, availability] = await Promise.all([
    tmdbFetch<TmdbMovie>(`/movie/${id}`),
    tmdbFetch<TmdbCredits>(`/movie/${id}/credits`),
    tmdbFetch<TmdbProviders>(`/movie/${id}/watch/providers`, {}),
  ]);
  const brazil = availability.results.BR;
  const providers: WatchProvider[] = (brazil?.flatrate ?? []).map((provider) => ({
    id: provider.provider_id,
    name: provider.provider_name,
    logoPath: provider.logo_path,
  }));
  return {
    ...toSummary(movie),
    runtime: movie.runtime ?? null,
    genres: movie.genres?.map((genre) => genre.name) ?? [],
    director: credits.crew.find((person) => person.job === "Director")?.name ?? null,
    cast: credits.cast.sort((a, b) => a.order - b.order).slice(0, 4).map((person) => person.name),
    providers,
    providerLink: brazil?.link ?? null,
  };
}
