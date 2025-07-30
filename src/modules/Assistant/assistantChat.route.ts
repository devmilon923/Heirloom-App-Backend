import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { AssistantChatControllers } from "./assistantChat.controller";

const router = Router();

router
  .route("/send")
  .post(guardRole("user"), AssistantChatControllers.sendAssistantMessage);
router
  .route("/my-conversations")
  .get(guardRole("user"), AssistantChatControllers.getMyAssistantConversations);
export const AssistantRoutes = router;
