import express from "express";
import { routesConfig } from "./routesConfig";

const router = express.Router();

routesConfig.forEach(({ path, handler }) => router.use(path, handler));

export default router;
