import { getRounds } from "bcrypt";
import { Router } from "express";

import { guardRole } from "../../middlewares/roleGuard";
import { journalControllers } from "./journals.controller";

const router = Router();
router.route("/add").post(guardRole("user"), journalControllers.addJournals);
router.route("/get").get(guardRole("user"), journalControllers.getJournals);
router
  .route("/delete/:journalid")
  .delete(guardRole("user"), journalControllers.deleteJournals);

router
  .route("/edit/:journalid")
  .patch(guardRole("user"), journalControllers.editJournals);

export const JournalRoutes = router;
