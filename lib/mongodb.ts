import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const mongoClientPromise =
    globalForMongo.mongoClientPromise ?? new MongoClient(uri).connect();

  if (process.env.NODE_ENV !== "production") {
    globalForMongo.mongoClientPromise = mongoClientPromise;
  }

  return mongoClientPromise;
}

export async function getDb() {
  const client = await getMongoClientPromise();
  return client.db(process.env.MONGODB_DB ?? "designplate");
}
