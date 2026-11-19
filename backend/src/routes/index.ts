import { Router } from "express";
import { currentUser } from "../middlewares/currentUser.js";
import { levelRoutes } from "./level.routes.js";
import { unitRoutes } from "./unit.routes.js";
import { wordRoutes } from "./word.routes.js";

export const apiRoutes = Router();
apiRoutes.use(currentUser);
apiRoutes.use("/levels", levelRoutes);
apiRoutes.use("/units", unitRoutes);
apiRoutes.use("/words", wordRoutes);
