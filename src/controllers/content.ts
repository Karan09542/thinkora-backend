import mongoose from "mongoose";
import Content from "../models/content";
import catchAsync from "../util/catchAsync";
import { AppError, status } from "../util/index";

import Perplexity from "@perplexity-ai/perplexity_ai";
import { config } from "../config/index";
import ChatSession from "../models/chatSession";

const ObjectId = mongoose.Types.ObjectId;
const client = new Perplexity({ apiKey: config.perplexityApiKey });

const SYSTEM_PROPMT_RULES = String.raw`
1. Output must always be valid Markdown.
2. Markdown must be fully compatible with react-markdown.
3. Use headings, lists, bold, italics, and spacing for readability.
4. Maintain the original intent and context of the user's content.
5. Do not include HTML or unsupported Markdown syntax.
6. Do not add explanations, system notes, or meta commentary.
7. Use emojis only if the user explicitly allows them.
8. If the user says “do not use emojis”, strictly avoid emojis.
9. Adapt tone and style based on the user's input.
10. The output MUST be clearly different in length and structure based on the selected category.
11. Return only the final Markdown content.
`;
const SYSTEM_PROMPTS = {
  rewrite: `
Rewrite the content below.
CONSTRAINTS:
- Keep roughly the same length as the original.
- Improve wording, grammar, and flow.
- Sentence structure may change, meaning must NOT.
- Do NOT add new details or remove existing ones.
`,
  expand: `
Expand the content below.

MANDATORY CONSTRAINTS:
- Output MUST be at least 2–3× longer than the original.
- Introduce NEW supporting details, explanations, or examples.
- Split content into multiple paragraphs or bullet points if possible.
- Do NOT repeat sentences using synonyms.
- If expansion is not obvious, explain concepts in depth.
`,
  shorten: `
Shorten the content below.

MANDATORY CONSTRAINTS:
- Reduce the content to 30–40% of its original length.
- Remove secondary details, examples, and repetition.
- Keep only the core message.
- Output must feel significantly more concise.
`,
  article: `
Write a complete article based on the content or topic below.

MANDATORY STRUCTURE:
- Use a title.
- Use at least 3 sections with headings.
- Each section must add new value.
- Content must be clearly longer and more detailed than the input.
`,
  summary: `
Summarize the content below.

MANDATORY CONSTRAINTS:
- Output must be no more than 5–7 bullet points OR one short paragraph.
- Remove all examples and explanations.
- Focus only on key conclusions or facts.
`,
};
async function getContent(
  prompt: string,
  category: keyof typeof SYSTEM_PROMPTS,
): Promise<{ content: string; response: string }> {
  const completion = await client.chat.completions.create({
    model: "sonar",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPTS[category] + SYSTEM_PROPMT_RULES,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    num_search_results: 3,
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
        status.HTTP_400_BAD_REQUEST,
      ),
    );
  }
  if (!(category.toLowerCase() in SYSTEM_PROMPTS)) {
    next(
      new AppError(
        `Category must be a valid enum: ${Object.keys(SYSTEM_PROMPTS)}, got ${category}`,
        status.HTTP_400_BAD_REQUEST,
      ),
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
    type: category.toLowerCase(),
  });

  res.status(status.HTTP_200_SUCCESS).json({
    message: "success",
    ...(isChatId ? { content: content } : { chatId }),
  });
});

// getting chat user sessions
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
    .sort({ cratedAt: -1 })
    .skip(skip)
    .limit(limit)
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
        category: "$type",
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
