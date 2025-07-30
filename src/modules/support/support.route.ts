import express from "express";

import { guardRole } from "../../middlewares/roleGuard";
import { deleteSupport, getSupport, needSupport } from "./support.controller";

const router = express.Router();
router.post("/need", needSupport);
//router.post("/update", guardRole("primary"), updateCategory);

router.get("/", guardRole("admin"), getSupport);
router.post("/delete", guardRole("admin"), deleteSupport);

export const SupportRoutes = router;
