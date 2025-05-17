import express, { Request, Response } from "express";
import cors from "cors";
import userRoute from "./routes/user.route";
import projectRouter from "./routes/project.route";
import aiRouter from "./routes/ai.route";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173", // or "*" for testing
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth/user", userRoute);
app.use("/api/v1/projects", projectRouter);
app.use("/ai", aiRouter);

app.use("/", (req: Request, res: Response) => {
  console.log("hello from root route");
});

export default app;
