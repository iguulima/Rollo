import { getMovieDetails, TmdbConfigurationError } from "@/lib/tmdb/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return Response.json({ error: "INVALID_MOVIE_ID" }, { status: 400 });
  }

  try {
    return Response.json(await getMovieDetails(movieId));
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "TMDB_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "TMDB_UNAVAILABLE" }, { status: 502 });
  }
}
