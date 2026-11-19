import { Router } from "express";
import { unitController } from "../controllers/unit.controller.js";
import { validate } from "../middlewares/validate.js";
import { idParam } from "../schemas/index.js";

export const unitRoutes = Router();
unitRoutes.get("/:id/words", validate(idParam, "params"), unitController.words);
