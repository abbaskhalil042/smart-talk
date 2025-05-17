import "dotenv/config";
import http from "http";
import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import app from "./app";
import Project from "./models/project.model";
import { generateResult } from "./services/ai.service";
import connectDB from "./db/db";

const port = process.env.PORT || 3000;

// Define AuthenticatedSocket interface
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload | { _id: string; email: string };
  project?: any;
  roomId?: string;
  projectId?: string;
}

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware for token and project validation
io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    const projectId = socket.handshake.query.projectId as string;

    if (!projectId) return next(new Error("Project ID is required"));
    if (!mongoose.Types.ObjectId.isValid(projectId))
      return next(new Error("Invalid Project ID"));

    const project = await Project.findById(projectId);
    if (!project) return next(new Error("Project not found"));
    socket.project = project;
    socket.projectId = projectId;

    if (!token) return next(new Error("Authentication error: Token missing"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    socket.user = decoded as JwtPayload;

    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// Socket.IO connection handler
io.on("connection", (socket: AuthenticatedSocket) => {
  socket.roomId = socket.project?._id.toString();

  console.log(`User connected to room: ${socket.roomId}`);

  if (socket.roomId) {
    socket.join(socket.roomId);
  }

  socket.on(
    "project-message",
    async (data: { message: string; sender: any }) => {
      const messageText = data.message;
      const aiIsPresent = messageText.includes("@ai");

      // Save user message
      if (socket.projectId) {
        await Project.findByIdAndUpdate(
          socket.projectId,
          {
            $push: {
              messages: {
                message: messageText,
                sender: data.sender,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        );
      }

      // Emit user message to everyone (including sender)
      if (socket.roomId) {
        io.to(socket.roomId).emit("project-message", data);
      }

      // Handle @ai messages
      if (aiIsPresent) {
        const prompt = messageText.replace("@ai", "").trim();

        try {
          const result = await generateResult(prompt);

          const aiMessage = {
            message: result,
            sender: {
              _id: "ai",
              email: "AI",
            },
            timestamp: new Date(),
          };

          // Emit AI response
          io.to(socket.roomId!).emit("project-message", aiMessage);

          // Store AI message
          await Project.findByIdAndUpdate(
            socket.projectId,
            { $push: { messages: aiMessage } },
            { new: true }
          );
        } catch (err) {
          console.error("AI error:", err);

          const errorMsg = {
            message: "Sorry, I could not process your request.",
            sender: {
              _id: "ai",
              email: "AI",
            },
            timestamp: new Date(),
          };

          io.to(socket.roomId!).emit("project-message", errorMsg);

          await Project.findByIdAndUpdate(
            socket.projectId,
            { $push: { messages: errorMsg } },
            { new: true }
          );
        }
      }
    }
  );

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected from room: ${socket.roomId}`);
    if (socket.roomId) {
      socket.leave(socket.roomId);
    }
  });
});

// Start server and connect to DB
server.listen(port, () => {
  connectDB();
  console.log(`Server is running on port ${port}`);
});
