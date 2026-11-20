
import mongoose from "mongoose";

const globalForMongoose = globalThis;

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = {
    connection: null,
    promise: null,
  };
}

const connectDb = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  if (globalForMongoose.mongooseCache.connection) {
    return globalForMongoose.mongooseCache.connection;
  }

  if (!globalForMongoose.mongooseCache.promise) {
    globalForMongoose.mongooseCache.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    globalForMongoose.mongooseCache.connection =
      await globalForMongoose.mongooseCache.promise;

    return globalForMongoose.mongooseCache.connection;
  } catch (error) {
    globalForMongoose.mongooseCache.promise = null;
    throw error;
  }
};

export default connectDb;
