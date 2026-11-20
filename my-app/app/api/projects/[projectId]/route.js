import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Project from "@/models/Project";
import { getProjectFileBucket } from "@/lib/gridfs";
import { requireCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  try {
    const { projectId } = await params;

    if (!mongoose.isValidObjectId(projectId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid project folder identifier." },
        { status: 400 },
      );
    }

    const user = await requireCurrentUser();
    const project = await Project.findOne({
      _id: projectId,
      creatorId: user._id,
    });

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project folder not found." },
        { status: 404 },
      );
    }

    const bucket = await getProjectFileBucket();
    await Promise.allSettled(
      project.files.map((file) => bucket.delete(file.fileId)),
    );
    await Project.deleteOne({ _id: project._id });
    revalidatePath(`/${user.username}`);
    revalidatePath("/dashboard");

    return NextResponse.json({
      ok: true,
      message: "Project folder deleted.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Could not delete the project folder." },
      { status: error.message?.includes("signed in") ? 401 : 500 },
    );
  }
}
