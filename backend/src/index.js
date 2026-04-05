import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { transactionsRouter } from "./routes/transactions.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import job from "./lib/cron.js";


const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendOrigin.split(",").map((item) => item.trim()),
    credentials: true
  })
);
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV === "production") job.start();
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/",(req,res)=> {return res.status(200).json({message:"Welcome to Fintech Backend API"})})
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});
