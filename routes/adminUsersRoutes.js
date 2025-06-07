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

router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetailsById);
router.get("/users/:userId/followers", getUserFollowersAdmin);
router.get("/users/:userId/following", getUserFollowingAdmin);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

export default router;
