import http from "http";
import dotenv from "dotenv";
import app from "./app";
import connectDB from "./db/db";
dotenv.config();
const server = http.createServer(app);
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000} `);
  connectDB();
});
