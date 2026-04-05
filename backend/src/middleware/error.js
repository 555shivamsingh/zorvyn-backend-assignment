import { fail } from "../lib/responses.js";

export function notFoundHandler(req, res) {
  return fail(res, "Route not found", 404);
}

export function errorHandler(error, req, res, next) {
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  if (error?.code === "P2002") {
    return fail(res, "Unique constraint violation", 409);
  }

  return fail(res, "Internal server error", 500);
}
