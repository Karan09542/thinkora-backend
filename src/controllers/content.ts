import mongoose from "mongoose";
import Content from "../models/content";
import catchAsync from "../util/catchAsync";
import { AppError, status } from "../util/index";

import Perplexity from "@perplexity-ai/perplexity_ai";
import { config } from "../config/index";
import ChatSession from "../models/chatSession";

const ObjectId = mongoose.Types.ObjectId;
const client = new Perplexity({ apiKey: config.perplexityApiKey });
async function getContent(
  prompt: string,
  category: string
): Promise<{ content: string; response: string }> {
  const completion = await client.chat.completions.create({
    model: "sonar",
    messages: [
      {
        role: "system",
        content:
          "Your are a content creator AI model. Generate high quality content based on the user's prompt. Make sure the content is markdown formatted and engaging. and well supports react-markdown, use emojis to make content more interesting and if user said to don't use emojis then don't use",
      },
      {
        role: "user",
        content: `category: ${category}\nuser prompt: ${prompt}`,
      },
    ],
  });
  const response = {
    content: completion.choices[0]?.message.content,
    citaion: completion.citations,
    search_results: completion.search_results,
  };
  return {
    content: (response.content as string) || "",
    response: JSON.stringify(response),
  };
}

export const generateContent = catchAsync(async (req, res, next) => {
  const { prompt, category } = req.body;

  if (!prompt.trim() || !category.trim()) {
    next(
      new AppError(
        "Prompt and category are required",
        status.HTTP_400_BAD_REQUEST
      )
    );
  }

  const userId = new mongoose.Types.ObjectId(req.userId);
  let chatId = req.params.chatId?.trim();
  const isChatId = !!chatId;

  let chatSession;
  if (!chatId) {
    chatSession = await ChatSession.create({ user_id: userId });
    chatId = chatSession._id.toString();
  }

  const { content } = await getContent(prompt, category);
  if (chatSession) {
    chatSession.title = content.substring(0, 30);
    await chatSession.save({ validateBeforeSave: false });
  }
  await Content.create({
    user_id: userId,
    chat_id: chatId,
    prompt,
    output_content: content,
    type: category,
  });
  res.status(status.HTTP_200_SUCCESS).json({
    message: "success",
    ...(isChatId ? { content: content } : { chatId }),
  });
});

// getting all user sessions
export const getChatSessions = catchAsync(async (req, res, _next) => {
  const userId = req.userId;

  let page = parseInt((req.query.page as string) || "0");
  let limit = parseInt((req.query.limit as string) || "10");

  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  if (isNaN(limit) || limit <= 0) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  const chatSessions = await ChatSession.find({
    user_id: new mongoose.Types.ObjectId(userId),
  })
    .skip(skip)
    .limit(limit)
    .sort({ cratedAt: -1 })
    .select("-__v -updatedAt");

  res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    chatSessions,
  });
});

// get perticular session by id
export const getChatSessionById = catchAsync(async (req, res, next) => {
  const chatId = req.params?.chatId?.trim();
  if (!chatId) {
    next(new AppError("Please provide chat Id", status.HTTP_400_BAD_REQUEST));
  }

  let page = parseInt((req.query.page as string) || "0");
  let limit = parseInt((req.query.limit as string) || "10");

  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  if (isNaN(limit) || limit <= 0) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  const chatSession = await Content.aggregate([
    {
      $match: { chat_id: new ObjectId(chatId) },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        prompt: 1,
        content: "$output_content",
      },
    },
  ]);

  res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    chatSession,
  });
});

export const deleteChatSessionById = catchAsync(async (req, res, next) => {
  let chatId = req.params.chatId?.trim();
  if (!chatId) {
    next(new AppError(`Provide a valid chatId`, status.HTTP_400_BAD_REQUEST));
  }

  await Content.deleteMany({ chat_id: new ObjectId(chatId) });
  await ChatSession.findByIdAndDelete(chatId);
  res.sendStatus(status.HTTP_204_NO_CONTENT);
});
