import type { Request, Response } from "express";
import { unitService } from "../services/unit.service.js";

export const unitController = {
  words: async (req: Request, res: Response) => {
    res.json(await unitService.words(req.user.id, res.locals.params.id));
  },
};
