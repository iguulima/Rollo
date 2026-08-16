-- Future server-side persistence. The UI already depends on WatchlistRepository,
-- so replacing localStorage only requires a gateway backed by these tables.
create table users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table watchlist_items (
  id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  tmdb_movie_id integer not null,
  movie_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (owner_id, tmdb_movie_id)
);

create index watchlist_items_owner_created_idx
  on watchlist_items(owner_id, created_at desc);
