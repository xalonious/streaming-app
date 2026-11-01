import "server-only";
import Joi from "joi";
import type { ProviderInput } from "../../providers/types";
import { normalizeBaseUrl, validateTemplate } from "../../providers/templates";
import ServiceError from "../ServiceError";

const schema = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  baseUrl: Joi.string().max(2048).required(),
  movieTemplate: Joi.string().trim().max(2048).empty("").allow(null).default(null),
  tvTemplate: Joi.string().trim().max(2048).empty("").allow(null).default(null),
  enabled: Joi.boolean().strict().default(true), isDefault: Joi.boolean().strict().default(false),
});
export function validateProvider(raw: unknown): ProviderInput {
  const { value, error } = schema.validate(raw, { allowUnknown: false, convert: true });
  if (error) throw ServiceError.validationFailed(error.details[0].message);
  const input = value as ProviderInput;
  try {
    input.baseUrl = normalizeBaseUrl(input.baseUrl);
    if (!input.movieTemplate && !input.tvTemplate) throw new Error("Provide a movie or TV template");
    if (input.movieTemplate) validateTemplate(input.movieTemplate, "movie", input.baseUrl);
    if (input.tvTemplate) validateTemplate(input.tvTemplate, "tv", input.baseUrl);
    if (input.isDefault && !input.enabled) throw new Error("The default provider must be enabled");
  } catch (e) { throw ServiceError.validationFailed((e as Error).message); }
  return input;
}
