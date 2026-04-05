import { fail } from "../lib/responses.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, "Invalid request payload", 422, parsed.error.flatten());
    }
    req.validatedBody = parsed.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, "Invalid query parameters", 422, parsed.error.flatten());
    }
    req.validatedQuery = parsed.data;
    return next();
  };
}
