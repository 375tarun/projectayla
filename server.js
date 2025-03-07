import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan'
import connectDb from './config/dbConfig.js';
import authRoutes from './routes/authRoutes.js'
import postRoutes from './routes/postRoutes.js'

//configurations
dotenv.config();
connectDb();

const app = express();
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
app.use(express.json())
app.use(morgan('dev'))

//routes
app.use('/api/auth',authRoutes);
app.use('/api/post',postRoutes);


const PORT =  process.env.PORT;
app.listen(PORT, ()=>{
    console.log(`server is running ${PORT}`)
})