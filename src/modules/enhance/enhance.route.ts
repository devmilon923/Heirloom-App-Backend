import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { EnhanceWithAIController } from "./enhance.controller";

const router = Router();

router
  .route("/enhance")
  .post(guardRole(["admin", "user"]), EnhanceWithAIController.enhanceJournal);

export const EnhanceRoutes = router;
