import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneOrEmail: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "TEACHER", "STUDENT"], required: true },
    institute_id: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
    clerk_id: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
