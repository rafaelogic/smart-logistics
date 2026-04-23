import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { ApiError } from "./errorMiddleware.js";

export type AuthenticatedUser = {
  sub: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError("UNAUTHORIZED", "Bearer token is required.", 401));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret ?? "test-secret");
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return next(new ApiError("INVALID_TOKEN", "JWT payload is invalid.", 401));
    }

    request.user = {
      sub: payload.sub,
      role: typeof payload.role === "string" ? payload.role : undefined
    };
    return next();
  } catch {
    return next(new ApiError("INVALID_TOKEN", "JWT is invalid or expired.", 401));
  }
}
