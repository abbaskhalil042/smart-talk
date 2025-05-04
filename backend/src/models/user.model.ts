import mongoose, { Document } from "mongoose";

interface userSchemaType extends Document {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema<userSchemaType>({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, "Email should be valid"],
  },

  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long"],
  },
});

const User = mongoose.model<userSchemaType>("User", userSchema);
export default User;
