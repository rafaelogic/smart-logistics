import dotenv from "dotenv";

dotenv.config();

export const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
  authUsername: process.env.AUTH_USERNAME,
  authPassword: process.env.AUTH_PASSWORD
};

if (!config.databaseUrl && config.nodeEnv !== "test") {
  throw new Error("DATABASE_URL is required");
}

if (!config.jwtSecret && config.nodeEnv !== "test") {
  throw new Error("JWT_SECRET is required");
}

if ((!config.authUsername || !config.authPassword) && config.nodeEnv !== "test") {
  throw new Error("AUTH_USERNAME and AUTH_PASSWORD are required");
}
