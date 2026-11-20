import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Project from "@/models/Project";
import { getProjectFileBucket } from "@/lib/gridfs";
import {
  sanitizeFilename,
  validateProjectFiles,
} from "@/lib/project-files";
import { requireCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const uploadFile = async ({ bucket, file, creatorId, projectId }) => {
  const filename = sanitizeFilename(file.name);
  const contentType = file.type || "application/octet-stream";
  const bytes = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        creatorId: String(creatorId),
        projectId: String(projectId),
      },
    });

    upload.once("error", reject);
    upload.once("finish", () => {
      resolve({
        fileId: upload.id,
        filename,
        contentType,
        size: file.size,
      });
    });
    upload.end(bytes);
  });
};

export async function POST(request) {
  const uploadedIds = [];
  let project;

  try {
    const user = await requireCurrentUser();
    const formData = await request.formData();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const files = formData
      .getAll("files")
      .filter((file) => typeof file?.arrayBuffer === "function");

    if (title.length < 3 || title.length > 80) {
      return NextResponse.json(
        { ok: false, error: "Project title must contain between 3 and 80 characters." },
        { status: 400 },
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { ok: false, error: "Project description must contain at most 500 characters." },
        { status: 400 },
      );
    }

    const fileError = validateProjectFiles(files);

    if (fileError) {
      return NextResponse.json(
        { ok: false, error: fileError },
        { status: 400 },
      );
    }

    const bucket = await getProjectFileBucket();
    project = new Project({
      creatorId: user._id,
      title,
      description,
      files: [],
    });

    const uploadedFiles = [];

    for (const file of files) {
      const uploadedFile = await uploadFile({
        bucket,
        file,
        creatorId: user._id,
        projectId: project._id,
      });

      uploadedIds.push(uploadedFile.fileId);
      uploadedFiles.push(uploadedFile);
    }

    project.files = uploadedFiles;
    await project.save();
    revalidatePath(`/${user.username}`);
    revalidatePath("/dashboard");

    return NextResponse.json({
      ok: true,
      message: "Project folder uploaded successfully.",
      projectId: String(project._id),
    });
  } catch (error) {
    try {
      const bucket = await getProjectFileBucket();
      await Promise.allSettled(uploadedIds.map((fileId) => bucket.delete(fileId)));
    } catch {
      // The original upload error is more useful than cleanup failures.
    }

    return NextResponse.json(
      { ok: false, error: error.message || "Could not upload the project folder." },
      { status: error.message?.includes("signed in") ? 401 : 500 },
    );
  }
}
