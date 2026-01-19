import { connect } from "mongoose";
import { server } from "./expressApp.js";
import { config } from "./config/index.js";

const PORT = process.env.PORT || 3000;
let isDBConnected = false;

async function connectDB() {
  if (isDBConnected) return;
  const DB_URL = config.databaseURL
    ? config.databaseURL?.replace("<db_password>", config.dbPassword as string)
    : "mongodb://localhost:27017/thinkora";

  // Database Connection
  connect(DB_URL)
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      console.error("Database connection failed", err);
    });
  isDBConnected = true;
}
connectDB();

// Starting the server
if (process.env.VERCEL !== "1") {
  server.listen(PORT, () => {
    if (config.isDev) {
      console.log(`Server running on http://localhost:${PORT}`);
    }
  });
}

export default server;
