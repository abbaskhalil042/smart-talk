import http from "http";
import app from "./app";
import connectDB from "./db/db";

const server = http.createServer(app);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  connectDB();
});
