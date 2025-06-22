import express from "express";
import { createAdmin, login, createRole, createPermission} from "../controllers/adminAuthController.js";


const router = express.Router();

router.post("/login", login);
router.post("/create-admin", createAdmin);
router.post("/create-role", createRole);
router.post("/create-permission", createPermission);


export default router;
