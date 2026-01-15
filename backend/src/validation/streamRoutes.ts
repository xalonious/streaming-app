import Joi from "joi";

export const movieStreamParamsSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().required(),
});

export const tvStreamParamsSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().required(),
  season: Joi.number().integer().positive().required(),
  episode: Joi.number().integer().positive().required(),
});

export const streamQuerySchema = Joi.object({
  color: Joi.string()
    .pattern(/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),

  autoPlay: Joi.boolean().truthy("true").falsy("false").optional(),

  nextEpisode: Joi.boolean().truthy("true").falsy("false").optional(),

  episodeSelector: Joi.boolean().truthy("true").falsy("false").optional(),

  progress: Joi.number().min(0).optional(),
}).unknown(false);
