import { server } from "./expressApp.js";
import { config } from "./config/index.js";

const PORT = process.env.PORT || 3000;

// Starting the server
if (process.env.VERCEL !== "1") {
  server.listen(PORT, () => {
    if (config.isDev) {
      console.log(`Server running on http://localhost:${PORT}`);
    }
  });
}

export default server;
