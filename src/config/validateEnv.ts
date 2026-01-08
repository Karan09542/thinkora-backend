import dotenv from "dotenv";
import path from "path";
import { AppError } from "../util/index";

dotenv.config({ path: path.join(__dirname, "../../.env") });
const getEnv = (key: string): string => {
  let value = process.env[key];
  if(key === "DB_URL" && !value){
    value = "mongodb://localhost:27017"
  }
  if (!value) {
    throw new AppError(
      `Missinge  environment variable: ${key}`,
      500
    );
  }
  return value!;
};

export default getEnv;
