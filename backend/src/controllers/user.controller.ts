import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashPassword });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.status(200).json({ message: "Signin successful", user });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
