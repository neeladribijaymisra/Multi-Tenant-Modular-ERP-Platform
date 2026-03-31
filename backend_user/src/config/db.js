import mongoose from "mongoose";

export default async function connectDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/AYRAERP";
  const isHostedRuntime =
    process.env.RENDER === "true" ||
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RENDER_EXTERNAL_URL);
  const isLocalMongo =
    uri.includes("127.0.0.1:27017") ||
    uri.includes("localhost:27017");

  if (isHostedRuntime && isLocalMongo) {
    throw new Error(
      "MongoDB is configured as localhost, but this backend is running on a hosted server. Use a cloud MongoDB URI such as MongoDB Atlas for deployment.",
    );
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB AYRAERP");
  } catch (error) {
    throw new Error(
      `Unable to connect to MongoDB with MONGODB_URI="${uri}". ${error.message}`,
    );
  }
}
