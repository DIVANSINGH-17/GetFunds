import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    maxlength: 80,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_]+$/,
  },
  profilepic: {
    type: String,
    trim: true,
  },
  coverpic: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  website: {
    type: String,
    trim: true,
    maxlength: 300,
  },
  fundingGoal: {
    type: Number,
    default: 10000,
    min: 100,
    max: 10000000,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || model("User", UserSchema);
