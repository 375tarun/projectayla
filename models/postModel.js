import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    img: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    hashtags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hashtag",
      },
    ],
  },
  {
    timestamps: true,
  }
);


postSchema.post('save', async function (doc, next) {
  if (doc.hashtags && doc.hashtags.length > 0) {
    await mongoose.model("Hashtag").updateMany(
      { _id: { $in: doc.hashtags } },
      { $inc: { postCount: 1 } }
    );
  }
  next();
});


postSchema.index({ hashtags: 1 });
export default mongoose.model("Post", postSchema);
