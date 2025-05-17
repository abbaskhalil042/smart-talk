import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongooseInstance = await mongoose.connect(process.env.MONGO_URI! as string);
    console.log("connected to database");

    // Now, let's understand the type of `mongooseInstance`
    // `mongooseInstance` is of type `typeof mongoose`
    // This means it's the same mongoose object you imported.

    // You can access connection details through mongooseInstance.connection
    // or simply mongoose.connection (since they are the same object after connect resolves this way)

    console.log(`Host: ${mongooseInstance.connection.host}`);
    console.log(`Port: ${mongooseInstance.connection.port}`);
    console.log(`Database Name: ${mongooseInstance.connection.name}`);
    // console.log(typeof mongooseInstance); // object
    // console.log(mongooseInstance === mongoose); // true

  } catch (error) {
    if (error instanceof Error) {
      console.error("Database connection error:", error.message); // More descriptive log
    } else {
      console.error("An unknown error occurred during database connection:", error);
    }
    process.exit(1);
  }
};

export default connectDB;