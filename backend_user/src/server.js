import dotenv from "dotenv";

import app from "./app.js";
import connectDatabase from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 4000;

async function startServer() {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log(`AYRA ERP API running on http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the running backend first, then start backend_user again.`);
      process.exit(1);
    }

    console.error("Backend server error:", error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error("Failed to start AYRA ERP API");
  console.error(error.message || error);
  process.exit(1);
});
