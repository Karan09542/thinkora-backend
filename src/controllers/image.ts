import { InferenceClient } from "@huggingface/inference";
import catchAsync from "../util/catchAsync";
import { AppError, status } from "../util/index";
import { config } from "../config/index";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import Image from "../models/image";
import mongoose from "mongoose";

cloudinary.config({
  cloud_name: "dv7jicdnq",
  secure: true,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

type ImageURLS = {
  url: string;
  public_id: string;
};

// provider: "nebius",
// model: "black-forest-labs/FLUX.1-schnell",

async function getImage(
  prompt: string,
  resolution: { width: number; height: number }
): Promise<ImageURLS> {
  const client = new InferenceClient(config.hfToken);

  const image = (await client.textToImage({
    provider: "together",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { num_inference_steps: 5, ...resolution },
  })) as unknown as Blob;

  const buffer = Buffer.from(await image.arrayBuffer());
  const imageUrls = await uploadImage(buffer);
  return imageUrls;
}
async function uploadImage(buffer: Buffer): Promise<ImageURLS> {
  try {
    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream((error, uploadResult) => {
            if (error) {
              return reject(error);
            }
            return resolve(uploadResult as UploadApiResponse);
          })
          .end(buffer);
      }
    );
    return { url: uploadResult.secure_url, public_id: uploadResult.public_id };
  } catch (error) {
    console.log("Error occur on uploading image");
    throw error;
  }
}

const RESOLUTION_MAP = {
  "1024x1024": { width: 1024, height: 1024 },
  "1024x768": { width: 1024, height: 768 },
  "768x1024": { width: 768, height: 1024 },
  "1280x720": { width: 1280, height: 720 },
};

type RESOLUTION_KEY = keyof typeof RESOLUTION_MAP;

export const generateImage = catchAsync(async (req, res, next) => {
  let {
    prompt,
    resolution,
    frequency,
  }: {
    prompt: string;
    resolution: RESOLUTION_KEY;
    frequency?: number;
  } = req.body;
  const userId = new mongoose.Types.ObjectId(req.userId);

  prompt = prompt.trim();
  resolution = resolution.trim() as RESOLUTION_KEY;
  frequency = Number(frequency);

  if (isNaN(frequency) || frequency <= 0) {
    frequency = 1;
  }

  if (!prompt) {
    next(new AppError("Prompt is required.", status.HTTP_400_BAD_REQUEST));
  }

  const imagePromises = [];
  for (let i = 0; i < frequency; i++) {
    imagePromises.push(
      getImage(
        prompt,
        RESOLUTION_MAP[resolution] ?? RESOLUTION_MAP["1024x1024"]
      )
    );
  }
  const urls = await Promise.all(imagePromises);
  const imageUrls = urls.map((i) => i.url);

  const image = await Image.create({
    user_id: userId,
    image_urls: urls,
    prompt,
  });

  res
    .status(status.HTTP_200_SUCCESS)
    .json({ status: "success", urls: imageUrls, _id: image._id });
});

export const imageHistory = catchAsync(async (req, res, _next) => {
  const userId = req.userId;

  let imageFreq = parseInt((req.query.imageFreq as string) || "-1");
  let page = parseInt((req.query.page as string) || "0");
  let limit = parseInt((req.query.limit as string) || "10");

  if (isNaN(imageFreq) || imageFreq <= 0) {
    imageFreq = -1;
  }
  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  if (isNaN(limit) || limit <= 0) {
    limit = 10;
  }

  const skip = (page - 1) * limit;

  const images = await Image.aggregate([
    {
      $match: { user_id: new mongoose.Types.ObjectId(userId) },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: true,
        urls: {
          $cond: {
            if: {
              $eq: [imageFreq, -1],
            },
            then: "$image_urls.url",
            else: {
              $slice: ["$image_urls.url", imageFreq],
            },
          },
        },
        prompt: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    images,
  });
});

export const getImageById = catchAsync(async (req, res, next) => {
  const { imageId } = req.params;
  if (!mongoose.isValidObjectId(imageId)) {
    next(new AppError("Provide a valid image id", status.HTTP_400_BAD_REQUEST));
  }
  const image = await Image.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(imageId) } },
    {
      $project: {
        _id: 1,
        urls: "$image_urls.url",
      },
    },
  ]);

  return res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    ...image[0],
  });
});

export const deleteImageById = catchAsync(async (req, res, next) => {
  let imageId = req.params.imageId?.trim();
  if (!imageId) {
    next(new AppError(`Provide a valid image id`, status.HTTP_400_BAD_REQUEST));
  }
  await Image.findByIdAndDelete(imageId);
  res.sendStatus(status.HTTP_204_NO_CONTENT);
});
