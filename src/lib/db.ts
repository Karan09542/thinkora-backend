import mongoose, { connect } from "mongoose";
import { config } from "../config/index.js";

const DB_URL = config.databaseURL
  ? config.databaseURL?.replace("<db_password>", config.dbPassword as string)
  : "mongodb://localhost:27017/thinkora";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connect(DB_URL, {
        bufferCommands: false
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
