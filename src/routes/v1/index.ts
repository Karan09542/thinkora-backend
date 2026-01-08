import express from "express";
import authRouter from "./auth";
import imageRouter from "./image";
import contentRouter from "./content";

const router = express.Router();
router.use("/auth", authRouter);
router.use("/image", imageRouter);
router.use("/content", contentRouter);

export default router;
