import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "User ID is required"],
      validate: {
        validator: (v: string) => mongoose.isValidObjectId(v),
        message: "Provide a valid User ID",
      },
      ref: "user",
    },
    image_urls: {
      type: [Object],
      required: [true, "Image url is required"],
      validate: {
        validator: (v:string[]) => v.length > 0,
        message: "Provide at least one image url"
      }
    },
    prompt: {
      type: String,
      required: [true, "Image propmt is required"]
    },
  },
  { timestamps: true }
);

const Image = mongoose.model("image", imageSchema);

export default Image;
