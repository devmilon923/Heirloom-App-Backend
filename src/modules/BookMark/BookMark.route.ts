import express from "express";
import { guardRole } from "../../middlewares/roleGuard";
import {
  createBookMarkController,
  getBookMarkController,
  removeBookMarkController,
} from "./BookMark.controller";

const router = express.Router();

router.get("/add", guardRole("user"), createBookMarkController);
router.delete("/remove", guardRole("user"), removeBookMarkController);
router.get("/", guardRole("user"), getBookMarkController);

export const BookMarkRoutes = router;
