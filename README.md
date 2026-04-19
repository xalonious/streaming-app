# Streaming App

A self-hosted web application for browsing, discovering, and playing media from user-configured streaming sources.  
Built for personal use and optimized for home servers and low-power devices such as a Raspberry Pi.

## Overview

Streaming App provides a cinematic, modern interface for exploring movies and TV shows, with a fully redesigned home page and title pages inspired by services like Cineby. The application does not include or bundle any media content and relies entirely on user-supplied sources.

## Features

- Movie & TV discovery powered by TMDB
- Auto-cycling hero banner with crossfade transitions and dot indicators
- TOP 10, Trending, Top Rated, and Browse by Genre sections
- Title logo art fetched from TMDB
- Full title pages with trailer background, cast, episodes, and recommendations
- Search overlay with animated results and recent history
- Fast, responsive React + TypeScript + Vite frontend
- Node/Express backend API
- Provider-agnostic streaming integration (configured via environment variables)
- Designed for private deployment behind a firewall, VPN, or reverse proxy

## Key Principles

- No hardcoded content providers
- No bundled or hosted media
- Fully self-hosted and user-controlled
- Focused on simplicity, performance, and privacy

## License

This project is licensed under the **MIT License**.