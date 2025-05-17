import mongoose from "mongoose";
import Project from "../models/project.model";

export const createProject = async ({
  name,
  userId,
}: {
  name: string;
  userId: string;
}) => {
  if (!name) {
    throw new Error("Name is required");
  }
  if (!userId) {
    throw new Error("UserId is required");
  }

  let project;
  try {
    project = await Project.create({
      name,
      users: [userId],
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new Error("Project name already exists");
    }
    throw error;
  }

  return project;
};

export const getAllProjectByUserId = async ({ userId }: { userId: string }) => {
  if (!userId) {
    throw new Error("UserId is required");
  }

  const allUserProjects = await Project.find({
    users: userId,
  });

  return allUserProjects;
};

export const addUsersToProject = async ({
  projectId,
  users,
  userId,
}: {
  projectId: string;
  users: string[];
  userId: string;
}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!users) {
    throw new Error("users are required");
  }

  if (
    !Array.isArray(users) ||
    users.some((userId) => !mongoose.Types.ObjectId.isValid(userId))
  ) {
    throw new Error("Invalid userId(s) in users array");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const project = await Project.findOne({
    _id: projectId,
    users: userId,
  });

  console.log(project);

  if (!project) {
    throw new Error("User not belong to this project");
  }

  const updatedProject = await Project.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      $addToSet: {
        users: {
          $each: users,
        },
      },
    },
    {
      new: true,
    }
  );

  return updatedProject;
};

export const getProjectById = async ({ projectId }: { projectId: string }) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await Project.findOne({
    _id: projectId,
  }).populate("users");

  return project;
};

export const updateFileTree = async ({
  projectId,
  fileTree,
}: {
  projectId: string;
  fileTree: object;
}) => {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  if (!fileTree) {
    throw new Error("fileTree is required");
  }

  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
    },
    {
      fileTree,
    },
    {
      new: true,
    }
  );

  return project;
};
