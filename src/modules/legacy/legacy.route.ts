import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { LegacyController } from "./legacy.controller";

const router = Router();

router.route("/add").post(guardRole("user"), LegacyController.addLegacy);
router.route("/").get(guardRole("user"), LegacyController.getLegacy);
router
  .route("/triggered")
  .get(guardRole("user"), LegacyController.getTriggeredLegacy);
router
  .route("/get/:legacyId")
  .get(guardRole("user"), LegacyController.getLegacyById);
router
  .route("/delete/:legacyId")
  .delete(guardRole("user"), LegacyController.deleteLegacyById);
router
  .route("/edit/:legacyId")
  .patch(guardRole("user"), LegacyController.editLegacyById);
router
  .route("/get-triggered/:legacyId")
  .get(guardRole("user"), LegacyController.getTriggeredLegacyById);

export const LegacyRoute = router;
