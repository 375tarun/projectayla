import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { Server } from "socket.io";
import { socketHandler } from './controllers/messageController.js';
import connectDb from "./config/dbConfig.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminAuthRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import hashtagRoutes from "./routes/hashtagRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminUsersRoutes from "./routes/adminUsersRoutes.js";
import adminMessageRoutes from "./routes/adminMessageRoutes.js";
import adminPostRoutes from "./routes/adminPostRoutes.js";
import rewardHistoryRoutes from "./routes/rewardHistoryRoutes.js";
import userBlockRoutes from './routes/userBlockRoutes.js'

// import { v2 as cloudinary } from "cloudinary";
import messageRoutes from './routes/messageRoutes.js';
import assetRoutes from "./routes/assetRoutes.js";
import http from "http";
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;
import noticeRoutes from "./routes/noticeRoutes.js";

//configurations
dotenv.config();
connectDb();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {  origin: "*", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//cors
app.use(
  cors({
    origin: "*", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies from the frontend
  })
);



//essentials middlewares
app.use(morgan("dev"));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use("/api/hashtags", hashtagRoutes);
app.use("/api/user", userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/rewardHistory', rewardHistoryRoutes);
app.use('/api/block', userBlockRoutes); // User block routes

app.use('/api/notice', noticeRoutes);
// Admin routes
app.use("/api/adminAuth", adminRoutes);
app.use("/api/adminUsers", adminUsersRoutes);
app.use("/api/adminMessages", adminMessageRoutes);
app.use("/api/adminPosts", adminPostRoutes);


socketHandler(io);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
