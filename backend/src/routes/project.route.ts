import { Router } from "express";
import { authUser } from "../middleware/auth.middleware";
import {
  addUserToProject,
  createProject,
  getAllProject,
  getProjectById,
  updateFileTree,
} from "../controllers/project.controller";

const projectRouter = Router();

projectRouter.post("/create", authUser, createProject);

projectRouter.get("/all", authUser, getAllProject);

projectRouter.put("/add-user", authUser, addUserToProject);

projectRouter.get("/get-project/:projectId", authUser, getProjectById);

projectRouter.put("/update-file-tree", authUser, updateFileTree);

export default projectRouter;
