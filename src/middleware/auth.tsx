import { config } from "../config/index.js";
import catchAsync from "../util/catchAsync.js";
import { AppError, status } from "../util/index.js";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.js";

export const authorize = catchAsync(async (req, _res, next) => {
  let token = req.headers.authorization;
  if (!token || !token.startsWith("Bearer")) {
    return next(new AppError("Invalid Token", status.HTTP_401_UNAUTHORIZED));
  }

  token = token.split(" ")[1]!;

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, config.jwtSecret) as { _id: string };
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired token, genereate a new one",
        status.HTTP_401_UNAUTHORIZED
      )
    );
  }

  const user = await UserModel.findById(decodedToken._id);
  if (!user) {
    return next(new AppError("Invalid Token", status.HTTP_401_UNAUTHORIZED));
  }

  req.userId = decodedToken._id;
  next();
});
