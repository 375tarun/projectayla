// // models/Resource.js
// import mongoose from "mongoose";

// const ResourceSchema = new mongoose.Schema({

//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },

//   category: {
//     type: String,
//     required: true,
//   },

//   status: {
//     type: String,
//     required: true,
//     enum: ["active", "inactive"],
//     default: "active",
//   },

//   purchasableWithCoins: {
//     type: Boolean,
//     default: false,
//     required: true,
//   },

//   priceInCoins: {
//     type: Number,
//     min: 0,
//     default: 0,
//   },

//   coinAmount: {
//     type: Number,
//     min: 0,
//     default: 0,
//   },

//   exclusiveToEvent: {
//     type: Boolean,
//     default: false,
//   },
//   eventId: {
//     type: String,
//     default: null,
//   },

//   purchasableWithRealMoney: {
//     type: Boolean,
//     default: false,
//   },
//   priceInDollars: {
//     type: Number,
//     min: 0,
//     default: 0,
//   },

//   isCoin: {
//     type: Boolean,
//     default: false,
//   },

//   isRentable: {
//     type: Boolean,
//     default: false,
//   },
//   defaultRentDurationDays: {
//     type: Number,
//     min: 0,
//     default: 0,
//   },

//   oneTimePurchase: {
//     type: Boolean,
//     default: false,
//   },

//   assetUrl: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   width: {
//     type: Number,
//     required: true,
//   },
//   height: {
//     type: Number,
//     required: true,
//   },

//   createdBy: {
//     type: Number,
//     default: null,
//   },

// }, { timestamps: true });


// ResourceSchema.pre('save', function (next) {
//   if (this.isNew) {
//     this.status = "active";
//   }
//   next();
// });
// export default mongoose.model("Resource", ResourceSchema);