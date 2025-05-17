import { Request, Response } from "express";
import * as ai from "../services/ai.service";

export const getResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.query;

    // Validate the input
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({
        message: "Prompt query parameter is required and must be a string.",
      });
      return;
    }

    console.log("Calling AI with prompt:", prompt);
    const result = await ai.generateResult(prompt);
    console.log("AI responded:", result);

    // Send the result
    res.status(200).send(result);
  } catch (error: any) {
    console.error("Error in getResult:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
