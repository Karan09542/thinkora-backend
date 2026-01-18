import UserModel from "../models/user.js";
import { AppError, status } from "../util/index.js";
import catchAsync from "../util/catchAsync.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

const signAccessToken = (_id: string) => {
  return jwt.sign({ _id }, config.jwtSecret, { expiresIn: "10s" });
};
const signRefreshToken = (_id: string) => {
  return jwt.sign({ _id }, config.jwtSecret, {
    expiresIn: "7d",
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username.trim() || !email.trim() || !password.trim()) {
    next(new AppError("name, email and password are required", 400));
    return;
  }

  const user = await UserModel.findOne({ email });
  if (user) {
    next(new AppError("User already exists", status.HTTP_409_CONFLICT));
    return;
  }

  await UserModel.create({ username, email, password });

  res.status(201).json({
    status: "success",
    message: "User created successfully",
  });
});
export const signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!password || !email.trim()) {
    return next(
      new AppError(
        "username and email are required",
        status.HTTP_400_BAD_REQUEST
      )
    );
  }

  const user = await UserModel.findOne({ email }).select(
    "+password -__v -createdAt -updatedAt"
  );
  if (!user) {
    return next(new AppError("user not found", status.HTTP_404_NOT_FOUND));
  }

  if (!(await user.isCorrectPassword(password))) {
    return next(
      new AppError("invalid credentials", status.HTTP_401_UNAUTHORIZED)
    );
  }

  const refreshToken = signRefreshToken(user.id);
  const accessToken = signAccessToken(user.id);
  const { password: _p, ...safeUser } = user.toObject();
  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
      path: "/v1",
    })
    .status(200)
    .json({ status: "success", user: { ...safeUser, token: accessToken } });
});

export const getUser = catchAsync(async (req, res, next) => {
  const userId = req.userId;

  if (!userId || !userId.trim()) {
    return next(new AppError("Missing user id", status.HTTP_401_UNAUTHORIZED));
  }
  const user = await UserModel.findById(userId).select("-__v");

  return res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    user,
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const incommingRefreshToken = req.cookies.refreshToken;
  if (!incommingRefreshToken) {
    return next(new AppError("Invalid token", status.HTTP_400_BAD_REQUEST));
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incommingRefreshToken, config.jwtSecret) as {
      _id: string;
    };
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired token, generate a new one",
        status.HTTP_400_BAD_REQUEST
      )
    );
  }

  const user = await UserModel.findById(decodedToken._id).select(
    "-__v -createdAt -updatedAt"
  );
  if (!user) {
    return next(
      new AppError(
        "Invalid token, user does not exist",
        status.HTTP_400_BAD_REQUEST
      )
    );
  }

  const accessToken = signAccessToken(user._id.toString());
  res.status(status.HTTP_200_SUCCESS).json({
    status: "success",
    user: { ...user.toObject(), token: accessToken },
  });
});

export const logout = catchAsync(async (_req, res, _next) => {
  res.clearCookie("refreshToken", { path: "/v1" }).sendStatus(204);
});
