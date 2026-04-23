import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

app.listen(config.port, () => {
  console.info(`Smart Logistics API listening on port ${config.port}`);
});
