import express from "express";

import { guardRole } from "../../middlewares/roleGuard";
import { addReport, getReport, makeReply } from "./report.controller";
import { getSupport } from "../support/support.controller";
// import { deleteSupport, getSupport, needSupport } from "./report.controller";

const router = express.Router();
router.post("/add/:suspectId", addReport);
//router.post("/update", guardRole("primary"), updateCategory);

router.get("/", guardRole("admin"), getReport);
router.post("/reply", guardRole("admin"), makeReply);
// router.post("/delete", guardRole("admin"), deleteSupport);

export const ReportRoutes = router;
