import { Router } from "express";
import { reviewController } from "../controllers/review.controller.js";
import { validate } from "../middlewares/validate.js";
import { createReviewBody, idParam, reviewAnswerBody } from "../schemas/index.js";

export const reviewRoutes = Router();
reviewRoutes.get("/active", reviewController.active);
reviewRoutes.post("/", validate(createReviewBody), reviewController.create);
reviewRoutes.get("/:id", validate(idParam, "params"), reviewController.get);
reviewRoutes.post("/:id/answer", validate(idParam, "params"), validate(reviewAnswerBody), reviewController.answer);
