import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/v1/index.js";
import {
  globalErrorhandleController,
  unHandleRoutesController,
} from "./util/errorHandling.js";
import { config } from "./config/index.js";

const app = express();

app.use(
  cors({
    origin: config.frontendURL,
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("<h1>hariom</h1>");
});

app.use("/v1", router);
app.all("/*path", unHandleRoutesController);
app.use(globalErrorhandleController);

export default app;
