import { decryptRefreshToken } from "../utils/encryptionAndOtp.js";
import jwt from "jsonwebtoken"

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