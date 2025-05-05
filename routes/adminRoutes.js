import express from "express";
import { signup, login} from "../controllers/adminAuthController.js";
import { authAdminMiddleware } from './../middlewares/authAdmin.middleware.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);


export default router;
