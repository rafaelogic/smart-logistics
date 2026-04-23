import type { NextFunction, Request, Response } from "express";

export function requestLoggerMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const start = process.hrtime.bigint();

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    console.info(
      `${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs.toFixed(1)}ms`
    );
  });

  next();
}
