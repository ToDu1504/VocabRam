import type { Request, Response, NextFunction } from "express";

// Single-user mode. TODO: replace with JWT verification when login exists.
export function currentUser(req: Request, _res: Response, next: NextFunction) {
  req.user = { id: 1 };
  next();
}
