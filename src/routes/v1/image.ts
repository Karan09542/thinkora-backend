import express from "express";
import {
  deleteImageById,
  generateImage,
  getImageById,
  imageHistory,
} from "../../controllers/image.js";
import { authorize } from "../../middleware/auth.js";
const router = express.Router();

router.post("/generate", authorize, generateImage);
router.post("/history", authorize, imageHistory);
router.post("/history/:imageId", authorize, getImageById);
router.delete("/:imageId", authorize, deleteImageById)

export default router;
