import mongoose, { Schema, model, Types, Document } from "mongoose";

// Interface for the user data
export interface IUser {
  email: string;
  password: string;
}

// Interface for the document returned by Mongoose (includes _id and methods)
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>({
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

const User = model<IUserDocument>("user", userSchema);
export default User;
