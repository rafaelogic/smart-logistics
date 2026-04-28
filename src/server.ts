import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.info(`Smart Logistics API listening on port ${config.port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Stop the existing process or set PORT to another value.`);
    process.exit(1);
  }

  throw error;
});
