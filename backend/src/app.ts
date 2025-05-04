import express, { Request, Response } from "express";
import userRoute from "./routes/user.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth/user", userRoute);

app.use("/", (req: Request, res: Response) => {
  console.log("hello from root route");
});

export default app;
