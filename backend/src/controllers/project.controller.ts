import { Request, Response } from "express";
import userModel from "../models/user.model";
import * as projectService from "../services/project.service";

// Extend Express Request to include 'userId'
interface AuthRequest extends Request {
  userId?: string;
}

export const createProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { name } = req.body;

    const loggedInUser = await userModel.findById(req.userId);

    if (!loggedInUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const newProject = await projectService.createProject({
      name,
      userId: loggedInUser._id.toString(),
    });

    res.status(201).json(newProject);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const getAllProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const loggedInUser = await userModel.findById(req.userId);

    if (!loggedInUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const allUserProjects = await projectService.getAllProjectByUserId({
      userId: loggedInUser._id.toString(),
    });

    res.status(200).json({ projects: allUserProjects });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const addUserToProject = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { projectId, users } = req.body;

    const loggedInUser = await userModel.findById(req.userId);

    if (!loggedInUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const project = await projectService.addUsersToProject({
      projectId,
      users,
      userId: loggedInUser._id.toString(),
    });

    res.status(200).json({ project });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;

  try {
    const project = await projectService.getProjectById({ projectId });

    res.status(200).json({ project });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

export const updateFileTree = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId, fileTree } = req.body;

    const project = await projectService.updateFileTree({
      projectId,
      fileTree,
    });

    res.status(200).json({ project });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};
