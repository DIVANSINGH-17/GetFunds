import mongoose from "mongoose";
import connectDb from "@/db/connectDB";

export const PROJECT_FILE_BUCKET = "projectFiles";

export const getProjectFileBucket = async () => {
  await connectDb();

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: PROJECT_FILE_BUCKET,
  });
};
