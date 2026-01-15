import express, { Request, Response } from "express";
import asyncHandler from "../core/asyncHandler";
import { validateRequest } from "../core/validation";
import * as streamService from "../service/streamService";
import {
  movieStreamParamsSchema,
  tvStreamParamsSchema,
  streamQuerySchema,
} from "../validation/streamRoutes";

const router = express.Router();

const toBool = (v: unknown): boolean | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return undefined;
};

const toNum = (v: unknown): number | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

router.get(
  "/movie/:tmdbId",
  validateRequest({ params: movieStreamParamsSchema, query: streamQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { tmdbId } = req.params as { tmdbId: string };
    const q = req.query as any;

    const result = await streamService.getMovieStreamUrl(tmdbId, {
      color: typeof q.color === "string" ? q.color : undefined,
      autoPlay: toBool(q.autoPlay),
      progress: toNum(q.progress),
    });

    res.status(200).json(result);
  })
);

router.get(
  "/tv/:tmdbId/:season/:episode",
  validateRequest({ params: tvStreamParamsSchema, query: streamQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { tmdbId, season, episode } = req.params as {
      tmdbId: string;
      season: string;
      episode: string;
    };
    const q = req.query as any;

    const result = await streamService.getTvStreamUrl(tmdbId, season, episode, {
      color: typeof q.color === "string" ? q.color : undefined,
      autoPlay: toBool(q.autoPlay),
      nextEpisode: toBool(q.nextEpisode),
      episodeSelector: toBool(q.episodeSelector),
      progress: toNum(q.progress),
    });

    res.status(200).json(result);
  })
);

export default router;
