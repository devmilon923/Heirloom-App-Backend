import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { MessagesController } from "./messages.controller";
import upload from "../../multer/multer";
import { UserControllers } from "../user/user.controller";

const router = Router();

router
  .route("/send")
  .post(
    guardRole("user"),
    upload.single("image"),
    MessagesController.sendMessage
  );
router.route("/aimode").post(guardRole("user"), MessagesController.aimode);
router.get("/:conversationId", guardRole("user"), UserControllers.getMessages);
router.get(
  "/media/:conversationId",
  guardRole("user"),
  UserControllers.getMedia
);
router.get(
  "/get/conversations",
  guardRole("user"),
  UserControllers.getConversation
);

router.post(
  "/upload/image",
  guardRole("user"),
  upload.single("image"),
  UserControllers.uploadImage
);

router.get("/inbox/stacks", guardRole("user"), MessagesController.messageStack);
export const MessageRoute = router;
