import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "fintech-backend",
    timestamp: new Date().toISOString()
  });
});
