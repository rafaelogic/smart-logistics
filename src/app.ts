import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware.js";
import { apiRouter } from "./routes/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicIndexPath = path.resolve(__dirname, "../public/index.html");

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggerMiddleware);
  app.use(apiRouter);
  app.use(express.static("public"));
  app.get(["/", "/dashboard", "/dashboard/*"], (_request, response) => {
    response.sendFile(publicIndexPath);
  });

  app.use(errorMiddleware);

  return app;
}
