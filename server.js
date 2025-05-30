import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { Server } from "socket.io";
import { socketHandler } from './controllers/messageController.js';
import connectDb from "./config/dbConfig.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import hashtagRoutes from "./routes/hashtagRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminUsersRoutes from "./routes/adminUsersRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import messageRoutes from './routes/messageRoutes.js';
import http from "http";


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
//cors
app.use(
  cors({
    origin: "*", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies from the frontend
  })
);

app.use(express.urlencoded({ extended: true }));

//essentials middlewares
app.use(express.json());
app.use(morgan("dev"));

//routes
app.use("/api/auth", authRoutes);
app.use("/api/adminAuth", adminRoutes);
app.use("/api/post", postRoutes);
app.use("/api/hashtags", hashtagRoutes);
app.use("/api/user", userRoutes);
app.use("/api/adminUsers", adminUsersRoutes);
app.use('/api/messages', messageRoutes);



socketHandler(io);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`server is running ${PORT}`);
});
