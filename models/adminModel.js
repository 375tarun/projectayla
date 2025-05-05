import mongoose from "mongoose";

const adminSchema = mongoose.Schema({
    adminName :{
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      
      },password: {
        type: String,
      },
})

export default mongoose.model('Admin',adminSchema);