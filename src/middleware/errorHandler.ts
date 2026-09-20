import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  const message = env.nodeEnv === "development" && err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
}
