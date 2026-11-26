import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is missing from .env");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
});

try {
  console.log("Connecting using MongoDB native driver...");

  await client.connect();

  console.log("MongoDB DRIVER CONNECTION SUCCESSFUL");

  const result = await client.db("admin").command({
    ping: 1,
  });

  console.log("MongoDB Ping Result:", result);

  console.log("MongoDB connection is working!");
} catch (error) {
  console.error("MONGODB DRIVER CONNECTION FAILED");
  console.error("Name:", error.name);
  console.error("Message:", error.message);
  console.error("Code:", error.code);

  if (error.cause) {
    console.error("Cause:", error.cause);
  }

  if (error.reason) {
    console.error("Server Selection Reason:", error.reason);
  }
} finally {
  await client.close().catch(() => {});
}
