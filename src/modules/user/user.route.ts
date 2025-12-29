import express from "express";

import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  //verifyOTP,
  resendOTP,
  changePassword,
  updateUser,
  getSelfInfo,
  deleteUser,
  verifyOTP,
  adminloginUser,
  getAllUsers,
  UserControllers,
} from "./user.controller";
import upload from "../../multer/multer";
import { guardRole } from "../../middlewares/roleGuard";

const router = express.Router();

router.post("/register", upload.single("image"), registerUser);

router.post("/login", loginUser);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/change-password", guardRole(["admin", "user"]), changePassword);
router.patch(
  "/profile-update",
  guardRole(["admin", "user"]),
  upload.single("image"),
  updateUser,
);

router.get("/my-profile", guardRole(["admin", "user"]), getSelfInfo);

router.delete("/account-delete", guardRole(["admin", "user"]), deleteUser);

//----------------------->Admin route <--------------------------------

router.post("/admin-login", adminloginUser);
router.get("/user-list", guardRole("admin"), getAllUsers);
router.get(
  "/dashboard-overall-stats",
  guardRole("admin"),
  UserControllers.getDashboardOverallStats,
);

export const UserRoutes = router;
