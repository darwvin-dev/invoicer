import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri; 
  return uri;
}

export async function stopInMemoryMongo() {
  await mongoose.connection.close().catch(() => {});
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
