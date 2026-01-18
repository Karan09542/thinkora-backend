import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "user",
    },
    chat_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Chat session id is required"],
      ref: "chatSession",
    },
    prompt: {
      type: String,
      required: [true, "Prompt is required"],
      trim: true,
      validate: {
        validator: (v) => v.trim(),
        message: "Provide a valid prompt",
      },
    },
    output_content: {
      type: String,
      required: [true, "Output content is required"],
    },
    type: {
      type: String,
      enum: ["rewrite", "expand", "shorten", "article", "summary"],
      required: [true, "Content type is required"],
    },
  },
  { timestamps: true },
);

const Content = mongoose.model("content", contentSchema);
export default Content;
