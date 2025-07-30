import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { ArticalsController } from "./articals.controller";

const router = Router();

router
  .route("/")
  .get(guardRole(["admin", "manager", "user"]), ArticalsController.getArticals);
export const ArticalsRoute = router;
