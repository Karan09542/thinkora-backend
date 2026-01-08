import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/v1/index.js";
import {
  globalErrorhandleController,
  unHandleRoutesController,
} from "./util/errorHandling.js";
import { config } from "./config/index.js";

// import fs from "fs";
// import path from "path";
// import { setTimeout as delay } from "timers/promises";

const app = express();

app.use(
  cors({
    origin: config.frontendURL,
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.setHeader("Cache-control", "max-age=10000")
  res.setHeader('Etag', 1)
  res.send("ram ram ram" + Math.random());
});

// ------------------------------
app.get("/v1/stream", async (_req, res) => {
  // res.setHeader("Content-Type", "text/plain; charset=utf-8");
  // res.setHeader("Cache-Control", "no-cache");
  // res.setHeader("Connection", "keep-alive");
  // res.flushHeaders()

  // const stream = fs.createReadStream(
  //   path.join(import.meta.dirname, "/util/appError.js"),
  //   { encoding: "utf-8", highWaterMark: 1000 }
  // );

  // stream.on("data", async (chunk) => {
  //   stream.pause()
  //   res.write(chunk + "\n")
  //   await delay(1000)
  //   stream.resume()
  // });
  // stream.on("end", () => {
  //   res.end();
  // });
  res.write("hello mahadev")

});

// ------------------------------
app.use("/v1", router);
app.all("/*path", unHandleRoutesController);
app.use(globalErrorhandleController);

export default app;
