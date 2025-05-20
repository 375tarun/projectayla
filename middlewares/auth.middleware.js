import { decryptRefreshToken } from "../utils/encryptionAndOtp.js";
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
    try {
      const encryptedToken = req.headers.authorization?.split(" ")[1];
  
      if (!encryptedToken) {
        return res
          .status(403)
          .json({ success: false, message: "Authentication required" });
      }
  
      // Decrypt the token
      const refreshToken = decryptRefreshToken(encryptedToken);
      if (!refreshToken) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid encrypted token" });
      }
  
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET_REFRESH_TOKEN
      );
  
      req.user = { _id: decoded._id };
      req.token = refreshToken;
      next();
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: "Authentication failed" });
    }
  };
  
  export const authCheck = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
  
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN);
      console.log(decoded);
      req.user = decoded;
      next();
    } catch (error) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired access token" });
    }
  };

export const checkAccess = async (req, res, next) => {
  const userId = req.user?._id;

  const route = `${req.baseUrl}${req.path}`;
  console.log(`Route hit: ${req.method} ${route}`); // logs: POST /api/chat/send

  if (!userId) {
    return res
      .status(403)
      .json({ success: false, message: "User ID not found. Access denied." });
  }

  const user = await userModel.findById(userId);

  if (!user) {
    return res
      .status(403)
      .json({ success: false, message: "User not found. Access denied." });
  }

  const requiredAccess = determineAccessFromRoute(route);

  if (!user.access.includes(requiredAccess)) {
    return res
      .status(403)
      .json({ success: false, message: `Access to '${requiredAccess}' denied.` });
  }

  next();
};

const determineAccessFromRoute = (route) => {
  if (route.startsWith("/api/messages")) return "Chat";
  if (route.startsWith("/api/post")) return "Post";
  if (route.startsWith("/api/room")) return "Room";
  return "";
};


