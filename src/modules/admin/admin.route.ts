import { Router } from "express";

// import {
//   handleWorkDay,
//   viewAvailability,
// } from '../availability/availability.controller';

import { guardRole } from "../../middlewares/roleGuard";
import { AdminController } from "./admin.controller";
import upload from "../../multer/multer";

const router = Router();

router.route("/clients-list").get(guardRole("admin"), AdminController.clients);
router.route("/driver-list").get(guardRole("admin"), AdminController.drivers);

router
  .route("/change-user/status/:userId")
  .get(guardRole("admin"), AdminController.changeUserStatus);

router
  .route("/add-artical")
  .post(guardRole("admin"), upload.single("image"), AdminController.addArtical);

router
  .route("/update-artical/:articalId")
  .patch(
    guardRole("admin"),
    upload.single("image"),
    AdminController.updateArtical
  );

router.route("/add-faq").post(guardRole("admin"), AdminController.addFaq);
router
  .route("/change-role/:userId")
  .post(guardRole("admin"), AdminController.changeRole);

router
  .route("/update-faq/:faqId")
  .patch(guardRole("admin"), AdminController.updateFAQ);

export const AdminRoutes = router;
