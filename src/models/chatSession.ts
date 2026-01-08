import mongoose from "mongoose";
const chatSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "User id is required to create chat session"],
      ref: "user",
    },
    title: {
      type: String,
      default: `New Chat ${new Date()}`,
    },
  },
  { timestamps: true }
);

const ChatSession = mongoose.model("chatSession", chatSessionSchema);
export default ChatSession;
