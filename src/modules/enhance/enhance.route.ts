import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { EnhanceWithAIController } from "./enhance.controller";

const router = Router();

router
  .route("/enhance")
  .post(guardRole(["admin", "user"]), EnhanceWithAIController.enhanceJournal);
router
  .route("/saveData")
  .post(guardRole(["admin", "user"]), EnhanceWithAIController.saveData);
router
  .route("/searchData")
  .post(guardRole(["admin", "user"]), EnhanceWithAIController.searchData);
export const EnhanceRoutes = router;
