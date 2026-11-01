import Joi from "joi";
export const streamQuerySchema = Joi.object({ providerId: Joi.string().max(100).optional() });

export const movieStreamParamsSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().required(),
});

export const tvStreamParamsSchema = Joi.object({
  tmdbId: Joi.number().integer().positive().required(),
  season: Joi.number().integer().positive().required(),
  episode: Joi.number().integer().positive().required(),
});


