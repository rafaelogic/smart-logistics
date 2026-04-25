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

  if (isMalformedJsonError(error)) {
    return response.status(400).json({
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
      code: 400
    });
  }

  if (isPostgresError(error)) {
    // Convert common database constraint failures into the same public error envelope as API errors.
    if (error.code === "42P01" || error.code === "42703") {
      return response.status(503).json({
        error: "DATABASE_NOT_MIGRATED",
        message: "Required database schema is missing or stale. Run npm run migrate.",
        code: 503
      });
    }

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

    if (error.code === "28000" || error.code === "28P01") {
      return response.status(503).json({
        error: "DATABASE_AUTH_FAILED",
        message: "Database authentication failed. Check DATABASE_URL.",
        code: 503
      });
    }

    if (isDatabaseSslError(error)) {
      return response.status(503).json({
        error: "DATABASE_SSL_REQUIRED",
        message: "Database connection requires SSL. Set DATABASE_SSL=true.",
        code: 503
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

function isPostgresError(error: unknown): error is { code: string; message?: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

function isDatabaseSslError(error: { message?: string }) {
  return error.message?.toLowerCase().includes("ssl") ?? false;
}

function isMalformedJsonError(error: unknown): error is { status: number; type: string } {
  return (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "type" in error &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  );
}
