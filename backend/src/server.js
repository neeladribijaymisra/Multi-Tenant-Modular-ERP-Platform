import dotenv from "dotenv";

import app from "./app.js";
import connectDatabase from "./config/db.js";

dotenv.config();

const port = process.env.PORT || 4000;

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`AYRA ERP API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start AYRA ERP API", error);
  process.exit(1);
});
