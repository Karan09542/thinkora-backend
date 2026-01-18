import { connect } from "mongoose";
import server from "./app.js";
import { config } from "./config/index.js";

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

// Starting the server
server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
