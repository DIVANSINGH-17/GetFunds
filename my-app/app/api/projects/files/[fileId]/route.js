import { Readable } from "node:stream";
import mongoose from "mongoose";
import Project from "@/models/Project";
import connectDb from "@/db/connectDB";
import { getProjectFileBucket } from "@/lib/gridfs";

export const runtime = "nodejs";

const INLINE_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/markdown",
  "text/plain",
]);

const contentDisposition = (filename, inline) => {
  const safeAscii = filename.replace(/[^a-zA-Z0-9._ -]/g, "_");
  const encoded = encodeURIComponent(filename);

  return `${inline ? "inline" : "attachment"}; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
};

export async function GET(_request, { params }) {
  const { fileId } = await params;

  if (!mongoose.isValidObjectId(fileId)) {
    return new Response("Invalid file identifier.", { status: 400 });
  }

  await connectDb();

  const objectId = new mongoose.Types.ObjectId(fileId);
  const project = await Project.findOne({ "files.fileId": objectId })
    .select("files")
    .lean();

  if (!project) {
    return new Response("Project file not found.", { status: 404 });
  }

  const file = project.files.find(
    (candidate) => String(candidate.fileId) === fileId,
  );

  if (!file) {
    return new Response("Project file not found.", { status: 404 });
  }

  const bucket = await getProjectFileBucket();
  const nodeStream = bucket.openDownloadStream(objectId);
  const webStream = Readable.toWeb(nodeStream);

  return new Response(webStream, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": contentDisposition(
        file.filename,
        INLINE_TYPES.has(file.contentType),
      ),
      "Content-Length": String(file.size),
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
