# Streaming App

A self-hosted web application for discovering movies and TV shows and playing
them through a user-configured streaming source. Streaming App combines a
cinematic React interface with a single Next.js application and is designed for personal
deployments on home servers and low-power devices such as a Raspberry Pi.

## Overview

Streaming App uses [The Movie Database (TMDB)](https://www.themoviedb.org/) for
search, artwork, cast information, trailers, episodes, collections, and
recommendations. Playback is provider-agnostic: the backend creates embed URLs
from the `STREAM_SOURCE` configured by the person hosting the application.

The project is one TypeScript application using Next.js App Router. The existing
React components provide browsing and playback, while Node.js Route Handlers keep
the TMDB API key private, validate requests, normalize TMDB responses, and resolve
stream URLs. One process serves the interface and API.

## Preview

### Home page

![Streaming App home page](preview/home.png)

### Details page

![Streaming App details page](preview/details.png)

## Features

- Movie and TV discovery powered by TMDB
- Auto-cycling hero slideshow with backdrop artwork and title logos
- Top 10, trending, top-rated, and genre-based browsing sections
- Search overlay with movie and TV filters, debounced results, and recent
  searches stored locally in the browser
- Detailed title pages with ratings, runtime, genres, overview, cast, trailers,
  recommendations, and related movie collections
- TV season selector and episode browser
- Cross-season episode search with cached season data
- Actor pages with biography, known-for titles, movies, and TV credits
- Full-screen iframe player for movies and individual TV episodes
- Responsive React and Tailwind CSS interface
- Validated Node.js Route Handlers with structured error responses, security headers, and
  development request logging
- Provider-neutral playback integration configured entirely through an
  environment variable

## Tech stack

| Area | Technologies |
| --- | --- |
| Interface | Next.js 16.4.3 App Router, React 19, TypeScript, Tailwind CSS 4.1.18, Axios |
| Server | Next.js Node.js Route Handlers, Axios, Joi; equivalent API security headers |
| Metadata | TMDB API with persistent SQLite caching; official IMDb ratings dataset |
| Storage and scheduling | better-sqlite3 (WAL), node-cron, dedicated IMDb child process |
| Playback | User-configured embed provider |

## Project structure

```text
streaming-app/
├── src/
│   ├── app/                # App Router pages and /api Route Handlers
│   │   ├── api/{health,tmdb,streams}/
│   │   ├── title/[type]/[id]/
│   │   ├── play/[type]/[id]/
│   │   └── actor/[id]/
│   ├── api/                # Existing browser-side Axios clients
│   ├── components/         # Existing UI, including screens/
│   ├── hooks/              # Existing data fetching and UI behavior
│   └── lib/server/         # Private integrations, transforms and validation
├── public/                 # Original favicon
├── preview/                # Original README screenshots
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Prerequisites

- Node.js >=22.9 (Node.js 22.20 or a current LTS recommended)
- npm
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- A streaming source supporting the embed URL format below

## Setup

Run all commands from the repository root:

```bash
npm ci
cp .env.example .env.local
```

On Windows PowerShell, copy the environment file with:

```powershell
Copy-Item .env.example .env.local
```

Set the values in `.env.local`:

```env
TMDB_API_KEY=YOUR_TMDB_API_KEY
STREAM_SOURCE=https://your-stream-provider.example
```

Then start the application:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). No separate backend or proxy is
needed. Both configuration variables stay server-side; use no `NEXT_PUBLIC_*`
variables for private credentials.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `TMDB_API_KEY` | Yes for metadata | Server-side TMDB API key |
| `STREAM_SOURCE` | Yes for playback | Base URL of the host-provided streaming embed service |
| `DATABASE_PATH` | No | SQLite file path; default `./data/streaming.db`, relative to the process working directory |
| `PORT` | No | Development listen port; defaults to 3000. Production `npm start` explicitly uses port 2222, overriding `PORT`; pass `--port` to select a different production port |

Next.js loads `.env.local` automatically. Production can instead supply the
variables through its service manager. Never commit secrets. `BACKEND_PORT` is
obsolete. Next.js sets `NODE_ENV` for development and production itself.

## Streaming source integration

`STREAM_SOURCE` must be an absolute base URL. A trailing slash is optional and
is removed automatically. The configured service is expected to support these
embed paths:

```text
/embed/movie/{tmdbId}
/embed/tv/{tmdbId}/{season}/{episode}
```

For example, a movie with TMDB ID `550` resolves to:

```text
https://your-stream-provider.example/embed/movie/550
```

The generated URL is loaded inside an iframe. The provider must therefore
permit framing from the domain where the frontend is hosted. Streaming App does
not download, proxy, store, or bundle video files.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start one Next.js development server |
| `npm run build` | Create and type-check the production application |
| `npm start` | Serve the production application, including its API, on port 2222 |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run imdb:import` | Manually refresh the official IMDb dataset using the safe worker importer |
| `npm run build:tools` | Rebuild generated Node.js maintenance/worker bundles |

## API overview

All application endpoints are served below `/api`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health/ping` | Check whether the backend is responding |
| `GET` | `/api/tmdb/search?q={query}&type={type}` | Search movies, TV shows, or both |
| `GET` | `/api/tmdb/trending?type={type}&window={window}` | Get daily or weekly trending titles |
| `GET` | `/api/tmdb/movie/{tmdbId}` | Get movie details, credits, and videos |
| `GET` | `/api/tmdb/tv/{tmdbId}` | Get TV details, credits, and videos |
| `GET` | `/api/tmdb/tv/{tmdbId}/season/{season}` | Get a season and its episodes |
| `GET` | `/api/tmdb/tv/{tmdbId}/episodes` | Get episodes across every season |
| `GET` | `/api/tmdb/{type}/{tmdbId}/recommendations` | Get related titles |
| `GET` | `/api/tmdb/{type}/{tmdbId}/images` | Get preferred title logo artwork |
| `GET` | `/api/tmdb/collection/{tmdbId}` | Get a movie collection |
| `GET` | `/api/tmdb/top-rated/{type}` | Get top-rated movies or TV shows |
| `GET` | `/api/tmdb/genres/{type}` | List movie or TV genres |
| `GET` | `/api/tmdb/discover/{type}/{genreId}` | Discover titles by genre |
| `GET` | `/api/tmdb/person/{personId}` | Get person details and selected credits |
| `GET` | `/api/streams/movie/{tmdbId}` | Resolve a movie embed URL |
| `GET` | `/api/streams/tv/{tmdbId}/{season}/{episode}` | Resolve a TV episode embed URL |

`type` accepts `movie` or `tv` unless an endpoint states otherwise. Search also
accepts `multi`, trending accepts `all`, and the trending window accepts `day`
or `week`. IDs, seasons, and episode numbers must be positive integers. Invalid
requests return a `400` response with the original Joi structure:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Validation failed",
  "details": { "params": { "tmdbId": "\"tmdbId\" must be a positive number" } }
}
```

Service errors retain their `{ "error": "..." }` body and HTTP status. Unknown
query keys are rejected by search/trending. GET handlers also support HEAD;
unsupported methods use the framework's 405 response. All TMDB requests use the
shared SQLite cache below the Axios service. Handlers remain dynamic with
`Cache-Control: no-store`; no Next.js fetch cache or independently expiring
render cache stores metadata. Existing client state caches remain unchanged.

Title details and normalized cards add a backward-compatible `rating` field:

```ts
{ value: 8.8, voteCount: 2679053, source: "imdb" } // source: "imdb" | "tmdb" | null
```

Original TMDB fields, including `vote_average` and `vote_count`, are preserved.
IMDb is preferred when a local mapping and rating exist. Otherwise TMDB is used;
missing ratings remain hidden. Ratings display only their numeric value, without
source labels. Homepage hero,
Top 10, trending, genre and top-rated cards, search, title details, actor-credit
cards, collection cards and recommendation grids share this behavior. Discovery
ordering and all navigation/player identifiers remain TMDB-based.

## SQLite storage and migrations

On Node.js server startup, `src/instrumentation.ts` opens the database, creates
its parent directory, and applies migrations before serving requests. Builds
do not initialize the scheduler or import data. Database imports are marked
`server-only`; database files must live outside `public/` and are ignored by Git.
One connection is reused per absolute path and process through `globalThis`,
including development reloads. SQLite uses WAL, NORMAL synchronization, a
5-second busy timeout, and a 4 MiB page cache per connection.

Migrations in `src/lib/server/db/migrations.ts` run in an IMMEDIATE transaction
and advance SQLite `PRAGMA user_version` only when committed. A database with a
newer schema is rejected rather than downgraded. Version 1 creates:

| Table | Key and stored data |
| --- | --- |
| `api_cache` | `cache_key` primary key; JSON, creation/expiry/stale/access timestamps, UTF-8 response byte count |
| `imdb_ratings` | `imdb_id` primary key; average rating, vote count, update timestamp |
| `imdb_mappings` | `(media_type, tmdb_id)` composite key; nullable IMDb ID, update and expiry timestamps |
| `import_metadata` | One row; attempt/success/failure timestamps, status, duration, active row count, error, source URL/ETag/Last-Modified/bytes, sampled peak RSS |
| `job_locks` | Named lock, unique owner token, lease expiry |
| `cache_statistics` | Cumulative named counters, flushed in batches |

Cache stale expiry and last access, and mapping expiry, have indexes. Ratings
and mapping lookups use their primary keys. All timestamps are Unix milliseconds.
IMDb reference tables are independent from disposable API cache eviction.

## TMDB cache policies

`src/lib/server/tmdbClient.ts` is the only upstream client, shared by all
services, Route Handlers and any future runtime Server Component callers.
Current page components fetch through API routes; none fetch metadata during
static generation. A future Server Component caller must render at request
time (for example with Next.js `connection()`), without `use cache` or
`unstable_cache` around this service.

Request keys include resource paths and sorted query parameters (language,
region, page, search query, append fields, filters, etc.), excluding credentials.
The persistent cache stores raw successful responses; rating enrichment happens
after cache reads so daily IMDb updates do not wait for TMDB cache expiry.

| Resource | Default TTL |
| --- | --- |
| Trending movie/TV/all | 2 hours |
| Popular and genre discovery | 6 hours |
| Top rated | 24 hours |
| Now playing / airing | 6 hours |
| Upcoming | 6 hours |
| Movie details, artwork, collections | 7 days |
| TV details, artwork, seasons and episodes | 24 hours |
| Person details and credits | 14 days |
| Recommendations and similar | 24 hours |
| Search | 1 hour |
| Genres and configuration | 30 days |
| TMDB-to-IMDb mappings, including known missing IDs | Up to 30 days |

Defaults are centralized in `cache/config.ts`; routing policies are in
`cache/policies.ts`. Upstream `max-age`, `Age`, `Expires` and shorter
`stale-while-revalidate` directives reduce these lifetimes. `no-store`, `private`
and `no-cache` responses are not retained; `must-revalidate` prevents stale use.
Mappings derived from cached external IDs cannot outlive the source response's
permitted lifetime. Deployment owners must also honor any more restrictive
[TMDB API agreement](https://www.themoviedb.org/api-terms-of-use) applicable to
their key; the application cannot discover account-specific contract terms.

Fresh cache hits return immediately without TMDB requests. Expired entries
within the permitted 24-hour default stale grace return immediately while one
background refresh runs. Misses share an in-flight promise per key and process.
There are at most six active upstream requests, with up to two short retries
for temporary/network errors. Repeated failures apply a bounded per-key backoff;
errors never replace cached JSON. Stale data is never served past `stale_until`.
Background work is best effort; the next request retries after restart.

Cleanup runs on startup/traffic and every 15 minutes. It deletes entries past
their stale lifetime and evicts least-recently-used entries to keep cached JSON
under 250 MiB. Writes enforce the budget immediately; access timestamps are
updated at most hourly per entry. The budget excludes IMDb data, SQLite indexes,
free pages and WAL overhead. SQLite reuses freed pages; this is a logical JSON
budget, not a 250 MiB database-file limit. Cache cleanup never deletes ratings
or mappings; expired mappings are maintained separately. Images and streams
continue using their existing browser/CDN/provider paths.

The local request inventory is: `/search/{type}`, `/trending/{type}/{window}`,
`/movie/{id}`, `/tv/{id}`, `/tv/{id}/season/{season}`, recommendations, images,
collections, top-rated lists, genres, discovery, person details with appended
combined credits, and movie/TV external IDs for ratings. The all-episodes service
uses the same cached TV/season paths. Playback services do not use this cache.

## Automatic IMDb ratings

Ratings come exclusively from the official
[IMDb non-commercial datasets](https://developer.imdb.com/non-commercial-datasets/),
using `https://datasets.imdbws.com/title.ratings.tsv.gz` as a source constant.
No scraping, per-title IMDb requests, paid APIs or additional credentials are used.

This data is for **individual personal, non-commercial use** under IMDb's
[licensing conditions](https://help.imdb.com/article/imdb/general-information/can-i-use-imdb-data-in-my-software/G5JTRESSHJBBHTGX)
and [conditions of use](https://www.imdb.com/conditions). It is not licensed by
this project's MIT license. Public redistribution, republishing or commercial
deployment requires appropriate permission/licensing; do not distribute the
generated database with the source code. Data attribution:
Information courtesy of [IMDb](https://www.imdb.com). Used with permission.

At startup, an empty dataset or a last success older than 24 hours starts a
nonblocking child-process import. Fresh data skips the download. `node-cron`
runs `0 4 * * *` in UTC with `noOverlap`. The daily job refreshes for that day's
04:00 slot even if a startup import was less than 24 hours earlier. A 15-minute
maintenance check recovers stale data after missed ticks or machine sleep.
No external cron/systemd timer is needed.

The importer streams HTTPS bytes through gzip decompression and incremental TSV
parsing. It validates headers, title IDs, 0–10 ratings, and nonnegative integer
votes; missing/malformed records are rejected. Batches of 1,000 rows commit to
a staging table while readers continue using active ratings. Duplicate IDs,
truncated gzip/downloads, size limits, more than 1% invalid rows, fewer than
1,000,000 valid rows, or a decrease below 80% of the previous row count fail
validation. Only a fully completed import atomically swaps staging into place
and records success/source metadata. Failure preserves active ratings and records
the error.

In-process controller overlap prevention and an atomic SQLite lock protect
imports across processes. A unique owner holds a two-minute lease, renewed every
20 seconds and checked before batch writes and activation. A crashed worker's
lease expires; the next owner discards abandoned staging. An old owner cannot
activate or delete its successor's staging. Workers have a 45-minute import
budget, a parent watchdog, and stop if the serving parent disappears. Shutdown
stops cron/maintenance and supervises the child where practical.

Failed automatic imports retry after 1, 5 and 30 minutes. Normal maintenance and
the next daily/startup check provide later recovery. IMDb failures do not stop
the app. Until data is available, the UI continues displaying TMDB ratings.

Mappings reuse movie `imdb_id` and TV appended `external_ids`. Collections use a
single SQLite batch join for all ratings. Unresolved mappings return TMDB ratings
immediately and queue background TMDB external-ID requests, with two resolver
workers, a 200-title queue, per-ID deduplication and failed-lookup cooldowns.
Known missing IDs are stored as NULL. No resolution requests run before the
dataset exists. Newly resolved ratings appear on subsequent metadata requests;
existing frontend state is not polled or reset.

Manual maintenance, normally unnecessary:

```bash
npm run imdb:import
```

The manual import uses the same child-process importer/lock, forcing a refresh
when no import owns the lock. Internal cache counters remain in SQLite; there is
no public administration endpoint.

## Backup, restoration and persistent deployment

Keep the database outside replaceable release directories. For Docker, mount a
local persistent volume, for example `-v streaming-data:/app/data`, with the app
working directory `/app`; alternatively mount `/var/lib/streaming-app` and set
`DATABASE_PATH=/var/lib/streaming-app/streaming.db`. Ensure the serving user can
write the whole directory (SQLite needs WAL/SHM siblings). Never mount it as
static content. Use local disk, not a network filesystem, for WAL locking.

For a live backup, use SQLite's online backup API/CLI, for example:

```bash
sqlite3 data/streaming.db ".backup 'streaming-backup.db'"
```

Alternatively stop the application cleanly before copying its database. Do not
copy only a live `.db` file while ignoring its WAL. Restore with the server
stopped: move the old database **and its matching WAL/SHM files** aside, copy the
backup to `DATABASE_PATH`, restore permissions, then start the app. Startup checks
schema and refreshes missing/outdated ratings. Never mix sidecars from different
database snapshots. Back up IMDb tables if avoiding a full recovery download
matters; API cache entries are disposable.

`scripts/build-tools.mjs` uses esbuild to bundle the TypeScript IMDb importer into
`runtime/imdb-worker.cjs`, which Node.js launches in a separate process so imports
do not block the Next.js request-serving event loop. It runs automatically before
`npm run dev` and `npm run build`; it does not download or import the dataset.
Keep `runtime/` in production alongside dependencies;
the worker needs Node.js and the platform's native `better-sqlite3` binding,
not TypeScript/esbuild at runtime. Maintenance npm scripts build missing bundles
when development dependencies are available. Rebuild tools after source edits.

The current deployment uses `next start`. If you opt into `output: 'standalone'`,
runtime bundles and native bindings are included by explicit tracing rules.
Copy `public/` and `.next/static/` as Next.js documents, verify `runtime/` is beside
the standalone `server.js`, and launch from that directory. If your packaging
tool omits these files, copy `runtime/` there explicitly. Use an absolute
`DATABASE_PATH` to keep data independent of standalone/release working directories.
For standalone maintenance, run `node runtime/imdb-worker.cjs --force` with the
deployment environment supplied.

On Raspberry Pi, prefer a supported 64-bit OS and Node.js LTS. Install native
dependencies on the target architecture; a compatible prebuilt binary or local
C++ build tools are required for better-sqlite3. Use reliable storage (preferably
SSD), allow space for both old and staging datasets plus WAL, and leave build
memory headroom. Imports stream in a separate process with a small SQLite page
cache; actual Pi duration/memory must be measured on the device.

One continuously running instance is the intended model. Multiple processes on
the same local database coordinate imports through leases, but each has its own
cron/controller, TMDB in-flight deduplication and mapping queue. They can duplicate
TMDB misses. SQLite serializes writers; very high write concurrency can hit the
busy timeout. Serverless/Edge/static-only hosting is not supported for automatic
refresh. No cache or scheduler environment toggles are needed.

## Checks and measured behavior

Check the application and build it for production:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

Measured on this Windows development machine with Node.js 22.20, November 1, 2026:

| Check | Observed result |
| --- | --- |
| Official dataset startup import | 1,727,597 ratings, 6,516 ms, 82,255,872 bytes sampled peak worker RSS (78.4 MiB) |
| Compressed dataset streamed | 8,728,224 bytes; no dataset file retained |
| Live movie 550 API, initially uncached / repeat | 372 ms / 12 ms (includes HTTP/service/enrichment overhead) |
| Persisted-cache movie/TV API after server restart | 13.74 ms / 15.49 ms |

These are observations, not Raspberry Pi benchmarks or controlled pre/post
portfolio performance claims. A cold catalogue also makes background mapping
calls, so its early aggregate hit rate is lower.
Subsequent import durations are recorded in SQLite. Third-party provider uptime and actual
video playback depend on the configured source.

## Production deployment

Build and start from the repository root:

```bash
npm ci
npm run build
npm start
```

Open [localhost:2222](http://localhost:2222). The production start script uses
port `2222`; development continues to use port `3000`.

For a different production port:

```bash
npm start -- --port 1111
```

Keep the production build (`.next`), generated `runtime/`, `public`, `package.json`, the lockfile,
`next.config.ts`, and installed dependencies together. Supply `TMDB_API_KEY`
and `STREAM_SOURCE` at runtime. No Vercel account, static export, separate API
process, or SPA fallback configuration is needed. A reverse proxy can forward
all requests to this one Node.js server. Do not serve `.next` as a static site.

Self-hosting on a Raspberry Pi is supported subject to Next.js/Node.js support
for the device's OS and CPU. Build on the target platform or a compatible build
host; native dependencies installed on Windows cannot be copied to Linux. Allow
enough RAM for the production build.

For a private deployment, place the application behind a firewall, VPN, or
authenticated reverse proxy. Use HTTPS when accessing it across a network and
only configure sources you are authorized to use.

## Content and privacy

- No movies, TV episodes, or other media are included in this repository.
- Streaming App does not host or upload media.
- Metadata and artwork are requested from TMDB.
- Recent search terms remain in the browser's local storage.
- Playback availability and behavior depend entirely on the configured source.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for
details.
