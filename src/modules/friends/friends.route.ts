import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { FriendControllers } from "./friends.controller";

const router = Router();

router.route("/request").post(guardRole("user"), FriendControllers.sendRequest);

router.route("/request").get(guardRole("user"), FriendControllers.getRequest);
router.route("/list").get(guardRole("user"), FriendControllers.getList);
router
  .route("/action/:requestId")
  .put(guardRole("user"), FriendControllers.action);

router
  .route("/update-relation/:requestId")
  .patch(guardRole("user"), FriendControllers.updateRelation);
router
  .route("/unfriend/:requestId")
  .delete(guardRole("user"), FriendControllers.unfriendAction);
export const FriendRoute = router;
