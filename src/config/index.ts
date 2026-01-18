import { ENV } from "./env";

export const config = {
  env: ENV.NODE_ENV,
  databaseURL: ENV.DB_URL,
  port: ENV.PORT,
  dbPassword: ENV.DB_PASSWORD,
  jwtSecret: ENV.JWT_SECRET,
  frontendURL: ENV.FRONTEND_URL,

  hfToken: ENV.HF_TOKEN,
  cloudinaryApiKey: ENV.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: ENV.CLOUDINARY_API_SECRET,
  perplexityApiKey: ENV.PERPLEXITY_API_KEY,

  isProd: ENV.NODE_ENV === "production",
  isDev: ENV.NODE_ENV === "development",
};
