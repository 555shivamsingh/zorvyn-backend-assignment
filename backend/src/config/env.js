import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "APP_JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required in environment variables`);
  }
}

if ((process.env.APP_JWT_SECRET || "").length < 32) {
  throw new Error("APP_JWT_SECRET must be at least 32 characters long");
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.APP_JWT_SECRET,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
};
