import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ProjectFileSchema = new Schema({
  fileId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  filename: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  },
  contentType: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: Number,
    required: true,
    min: 1,
    max: 5 * 1024 * 1024,
  },
}, {
  _id: false,
});

const ProjectSchema = new Schema({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 80,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  files: {
    type: [ProjectFileSchema],
    validate: {
      validator: (files) => files.length > 0 && files.length <= 5,
      message: "A project folder must contain between 1 and 5 files.",
    },
  },
}, {
  timestamps: true,
});

ProjectSchema.index({ creatorId: 1, updatedAt: -1 });

export default mongoose.models.Project || model("Project", ProjectSchema);
