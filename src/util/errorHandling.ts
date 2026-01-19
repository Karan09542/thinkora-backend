import type { ErrorRequestHandler, Response } from "express";
import AppError from "./appError.js";
import catchAsync from "./catchAsync.js";
import { config } from "../config/index.js";

export const unHandleRoutesController = catchAsync(async (req, res, _next) => {
  return res.status(404).json({
    message: `the route you are looking for not exists, url:${req.originalUrl}`,
  });
});

const sendDevError = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
const sendProdError = (err: AppError, res: Response) => {
  if (err.statusCode === 500) {
    res.status(500).json({
      status: "error",
      message: "Oh! something went wrong",
    });
    return;
  }
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

export const globalErrorhandleController: ErrorRequestHandler = (
  err: AppError,
  _req,
  res,
  _next,
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";
  err.status = err.status || "error";
  console.log(_req.originalUrl);
  console.log(err);
  if (config.isProd) {
    return sendProdError(err, res);
  }
  return sendDevError(err, res);
};
