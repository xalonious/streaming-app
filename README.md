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
| Metadata | TMDB API |
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

- Node.js 22 or newer recommended; Next.js requires Node.js >=20.9.0
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
unsupported methods use the framework's 405 response. Metadata is fetched with
the original Axios integration on each API request, without Next.js data caching.

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

Keep the production build (`.next`), `public`, `package.json`, the lockfile,
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
