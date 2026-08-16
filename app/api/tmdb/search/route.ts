import { NextRequest } from "next/server";
import { searchMovies, TmdbConfigurationError } from "@/lib/tmdb/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ results: [] });

  try {
    return Response.json({ results: await searchMovies(query) });
  } catch (error) {
    if (error instanceof TmdbConfigurationError) {
      return Response.json({ error: "TMDB_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error(error);
    return Response.json({ error: "TMDB_UNAVAILABLE" }, { status: 502 });
  }
}
