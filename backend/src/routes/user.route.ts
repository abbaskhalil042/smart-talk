import express from "express";
import { signin, signup } from "../controllers/user.controller";

const userRoute = express.Router();


userRoute.post("/signup", signup);
userRoute.post("/signin", signin);

export default userRoute;
