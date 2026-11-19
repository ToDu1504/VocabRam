import type { Request, Response } from "express";
import { reviewService } from "../services/review.service.js";

export const reviewController = {
  active: async (req: Request, res: Response) => {
    res.json({ sessions: await reviewService.active(req.user.id) });
  },
  create: async (req: Request, res: Response) => {
    res.status(201).json(await reviewService.create(req.user.id, res.locals.body));
  },
  get: async (req: Request, res: Response) => {
    res.json(await reviewService.get(req.user.id, res.locals.params.id));
  },
  answer: async (req: Request, res: Response) => {
    res.json(await reviewService.answer(req.user.id, res.locals.params.id, res.locals.body));
  },
};
