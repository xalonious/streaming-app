import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { loggingMiddleware } from './loggingMiddleware';

dotenv.config();

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200
};

export default function installMiddlewares(app: Express) {
  app.use(cors(corsOptions));
  app.use(helmet());
  app.use(loggingMiddleware)
  app.use(express.json());
}