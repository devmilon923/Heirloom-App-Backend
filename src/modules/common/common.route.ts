import { Router } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { FriendControllers } from "../friends/friends.controller";

const router = Router();
router.route("/pepole").get(guardRole("user"), FriendControllers.pepoleSearch);
export const CommonRoute = router;
