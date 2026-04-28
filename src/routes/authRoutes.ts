import { Router } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config/index.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ApiError } from "../middlewares/errorMiddleware.js";
import { loginSchema } from "../validations/schemas.js";

export const authRouter = Router();

authRouter.post("/token", (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);

    if (input.username !== config.authUsername || input.password !== config.authPassword) {
      throw new ApiError("INVALID_CREDENTIALS", "Username or password is incorrect.", 401);
    }

    const signOptions: SignOptions = {
      subject: input.username,
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"]
    };

    const token = jwt.sign(
      {
        role: "api-client"
      },
      config.jwtSecret ?? "test-secret",
      signOptions
    );

    response.json({
      tokenType: "Bearer",
      expiresIn: config.jwtExpiresIn,
      accessToken: token
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", authMiddleware, (request, response) => {
  response.json({
    user: {
      username: request.user?.sub,
      role: request.user?.role ?? "api-client"
    }
  });
});
