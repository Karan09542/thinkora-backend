import express from "express";
import {
  getUser,
  refreshToken,
  signIn,
  signUp,
  logout,
} from "../../controllers/auth.js";
import { authorize } from "../../middleware/auth.js";

const router = express.Router();
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);
router.post("/get-user", authorize, getUser);
router.post("/refresh-token", refreshToken);
router.delete("/logout", authorize,logout )
router.get("/", (_, res) => res.send("haribol"));

export default router;
