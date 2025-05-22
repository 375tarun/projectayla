import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUserDetailsById,
  getUserFollowersAdmin,
  getUserFollowingAdmin,
  updateUser,
} from "../controllers/adminUsersController.js";
import { authCheck } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.get("/users", authCheck, getAllUsers);
router.get("/users/:userId", authCheck, getUserDetailsById);
router.get("/users/:userId/followers", authCheck, getUserFollowersAdmin);
router.get("/users/:userId/following", authCheck, getUserFollowingAdmin);
router.put("/users/:userId", authCheck, updateUser);
router.delete("/users/:userId", authCheck, deleteUser);

export default router;
