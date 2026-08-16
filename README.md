# Rollo

Watchlist pessoal de filmes com sorteio, construída em Next.js e alimentada pela TMDB.

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Preencha `TMDB_READ_ACCESS_TOKEN` com o API Read Access Token da sua conta TMDB.
3. Instale e execute:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Persistência

Nesta versão, a watchlist usa `LocalStorageWatchlistRepository` e fica salva apenas no navegador atual. A interface depende de `WatchlistRepository`, não de `localStorage` diretamente.

Para migrar para banco:

1. Implemente `WatchlistDatabaseGateway` com o ORM escolhido.
2. Use `DatabaseWatchlistRepository` no ponto de composição.
3. Adicione um identificador de proprietário quando autenticação for implementada.

O esquema relacional inicial está em `db/schema.sql`.

## APIs internas

- `GET /api/tmdb/search?q=...`
- `GET /api/tmdb/movies/:id`

O token TMDB nunca é enviado ao navegador.
