-- Future server-side persistence. The UI already depends on repository contracts,
-- so replacing localStorage only requires gateways backed by these tables.
create table users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table watchlist_items (
  id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  tmdb_movie_id integer not null,
  movie_snapshot jsonb not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, tmdb_movie_id)
);

create index watchlist_items_owner_position_idx
  on watchlist_items(owner_id, position asc);

create table watched_items (
  id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  tmdb_movie_id integer not null,
  movie_snapshot jsonb not null,
  watched_at timestamptz not null default now(),
  unique (owner_id, tmdb_movie_id)
);

create index watched_items_owner_watched_idx
  on watched_items(owner_id, watched_at desc);
