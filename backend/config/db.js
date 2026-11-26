
import mongoose from "mongoose";

const MAX_CONNECTION_ATTEMPTS = 3;
const SERVER_SELECTION_TIMEOUT_MS = 10000;

const isRetryableConnectionError = (error) =>
  [
    "MongoNetworkError",
    "MongoServerSelectionError",
    "MongooseServerSelectionError"
  ].includes(error?.name);

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_CONNECTION_ATTEMPTS; attempt++) {
    try {
      console.log(
        attempt === 1
          ? "Connecting to MongoDB Atlas..."
          : `Retrying MongoDB Atlas connection (${attempt}/${MAX_CONNECTION_ATTEMPTS})...`
      );

      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error("=================================");
      console.error("MONGODB CONNECTION FAILED");
      console.error("Attempt:", `${attempt}/${MAX_CONNECTION_ATTEMPTS}`);
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Code:", error.code);
      console.error("=================================");

      if (!isRetryableConnectionError(error) || attempt === MAX_CONNECTION_ATTEMPTS) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};

export default connectDB;
