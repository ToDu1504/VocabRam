import type { Request, Response } from "express";
import { levelService } from "../services/level.service.js";

export const levelController = {
  list: async (req: Request, res: Response) => {
    res.json({ levels: await levelService.list(req.user.id) });
  },
  units: async (req: Request, res: Response) => {
    res.json(await levelService.units(req.user.id, res.locals.params.code));
  },
};
