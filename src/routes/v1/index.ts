import express from "express";
import authRouter from "./auth.js";
import imageRouter from "./image.js";
import contentRouter from "./content.js";
import { withDB } from "../../middleware/db.js";

const router = express.Router();
router.use(withDB);
router.use("/auth", authRouter);
router.use("/image", imageRouter);
router.use("/content", contentRouter);

export default router;
