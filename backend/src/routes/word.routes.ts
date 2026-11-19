import { Router } from "express";
import { wordController } from "../controllers/word.controller.js";
import { validate } from "../middlewares/validate.js";
import { answerBody, idParam } from "../schemas/index.js";

export const wordRoutes = Router();
wordRoutes.post("/:id/answer", validate(idParam, "params"), validate(answerBody), wordController.answer);
