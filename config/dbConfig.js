import mongoose from "mongoose";

const connectDb = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`connected to mongodb ${conn.connection.host}`)
    } catch (error) {
        console.log(`error in connecting db ${error}`)
    }
}
export default connectDb;