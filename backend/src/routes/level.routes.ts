import { Router } from "express";
import { levelController } from "../controllers/level.controller.js";
import { validate } from "../middlewares/validate.js";
import { levelCodeParam } from "../schemas/index.js";

export const levelRoutes = Router();
levelRoutes.get("/", levelController.list);
levelRoutes.get("/:code/units", validate(levelCodeParam, "params"), levelController.units);
