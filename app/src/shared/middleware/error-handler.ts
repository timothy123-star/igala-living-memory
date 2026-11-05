
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {

  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "An unexpected server error occurred"
  });
};
