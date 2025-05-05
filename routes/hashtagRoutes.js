import express from "express";
import {createHashtag} from "../controllers/hashtagController.js"
import { authAdminMiddleware } from './../middlewares/authAdmin.middleware.js';

const router = express.Router();

router.post('/create',authAdminMiddleware,createHashtag)


export default router;
