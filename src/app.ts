import express from "express";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggerMiddleware);
  app.use(apiRouter);

  app.use(errorMiddleware);

  return app;
}
