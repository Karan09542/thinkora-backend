import express from "express";
import {
  deleteChatSessionById,
  generateContent,
  getChatSessionById,
  getChatSessions,
} from "../../controllers/content";
import { authorize } from "../../middleware/auth";

const router = express.Router();
router.post("/generate", authorize, generateContent);
router.post("/generate/:chatId", authorize, generateContent);
router.post("/chat-sessions", authorize, getChatSessions);
router.post("/chat-sessions/:chatId", authorize, getChatSessionById);
router.delete("/chat-sessions/:chatId", authorize, deleteChatSessionById);

export default router;
