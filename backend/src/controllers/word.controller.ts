import type { Request, Response } from "express";
import { progressService } from "../services/progress.service.js";

export const wordController = {
  answer: async (req: Request, res: Response) => {
    res.json(await progressService.answer(req.user.id, res.locals.params.id, res.locals.body));
  },
};
