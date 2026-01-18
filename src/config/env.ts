import getEnv from "./validateEnv.js";

export const ENV = {
  NODE_ENV: getEnv("NODE_ENV"),
  DB_URL: getEnv("DB_URL"),
  DB_PASSWORD: getEnv("DB_PASSWORD"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  FRONTEND_URL: getEnv("FRONTEND_URL"),
  HF_TOKEN: getEnv("HF_TOKEN"),
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
  PERPLEXITY_API_KEY: getEnv("PERPLEXITY_API_KEY"),
};
