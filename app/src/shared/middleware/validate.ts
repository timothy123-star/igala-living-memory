
import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export function validateBody<T extends ZodType>(
  schema: T
): RequestHandler {

  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        status: "fail",
        message: "Request body validation failed",
        errors: result.error.issues
      });

      return;
    }

    // Replace the original body with the validated output.
    req.body = result.data;

    next();
  };
}

export function validateParams<T extends ZodType>(
  schema: T
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      res.status(400).json({
        status: "fail",
        message: "Request parameters validation failed",
        errors: result.error.issues
      });
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

export function validateQuery<T extends ZodType>(
  schema: T
): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        status: "fail",
        message: "Request query validation failed",
        errors: result.error.issues
      });
      return;
    }

    res.locals.validatedQuery = result.data;
    next();
  };
}
