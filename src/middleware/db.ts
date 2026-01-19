import type { NextFunction } from "express";
import { connectDB } from "../lib/db.js";

export async function withDB(req: any, _res: any, next: NextFunction) {
  if (req.method === "OPTIONS") {
    return req.sendStatus(204);
  }
  try {
    await connectDB();
  } catch (error) {
    next(error);
  }
  next();
}
