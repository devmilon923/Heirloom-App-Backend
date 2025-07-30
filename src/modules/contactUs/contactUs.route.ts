import express from "express";
import {
  createMessageController,
  deleteMessage,
  getMessagesController,
} from "./contactUs.controller";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post("/message", createMessageController);
router.get("/", guardRole("admin"), getMessagesController);
router.post("/delete", guardRole("admin"), deleteMessage);

export const contactUsRoutes = router;
