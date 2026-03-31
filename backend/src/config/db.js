import mongoose from "mongoose";

export default async function connectDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/AYRAERP";

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB AYRAERP");
}
