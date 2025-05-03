import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI! as string);
    console.log("connected to database");
    //* i got problem here to understand the type of the
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
    process.exit(1);
  }
};

export default connectDB;
