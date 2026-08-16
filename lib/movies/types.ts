export type MovieSummary = {
  id: number;
  title: string;
  originalTitle: string;
  releaseYear: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  rating: number;
};

export type WatchProvider = {
  id: number;
  name: string;
  logoPath: string | null;
};

export type MovieDetails = MovieSummary & {
  runtime: number | null;
  genres: string[];
  director: string | null;
  cast: string[];
  providers: WatchProvider[];
  providerLink: string | null;
};

export const tmdbImage = (path: string | null, size: "w342" | "w500" | "w780" | "original" = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
