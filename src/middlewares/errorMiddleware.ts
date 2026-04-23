import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly error: string,
    message: string,
    public readonly code = 400
  ) {
    super(message);
  }
}

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ApiError) {
    return response.status(error.code).json({
      error: error.error,
      message: error.message,
      code: error.code
    });
  }

  if (error instanceof ZodError) {
    return response.status(422).json({
      error: "VALIDATION_ERROR",
      message: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      code: 422
    });
  }

  if (isPostgresError(error)) {
    // Convert common database constraint failures into the same public error envelope as API errors.
    if (error.code === "23505") {
      return response.status(409).json({
        error: "DUPLICATE_RESOURCE",
        message: "A resource with this unique value already exists.",
        code: 409
      });
    }

    if (error.code === "23514" || error.code === "22P02") {
      return response.status(422).json({
        error: "VALIDATION_ERROR",
        message: "The request violates a database constraint.",
        code: 422
      });
    }
  }

  console.error(error);
  return response.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
    code: 500
  });
}

function isPostgresError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}
