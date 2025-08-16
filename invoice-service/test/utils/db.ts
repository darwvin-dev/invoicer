import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
  if (mongod) return;
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: "test" });
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
