import express from "express";
import { signup, login, sendOtpEmail, newAccessToken} from "../controllers/authController.js";
import { authMiddleware } from './../middlewares/auth.middleware.js';

const router = express.Router();

router.post("/send-otp-email", sendOtpEmail);
router.post("/signup", signup);
router.post("/login", login);
router.get("/new-access-token", authMiddleware, newAccessToken);

export default router;
