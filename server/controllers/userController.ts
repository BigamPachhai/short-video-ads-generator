import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
//Get User Credits

export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json({ credits: user?.credits || 0 });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//const get all user projects
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//Get user project by id
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ project });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

//publish/unpublish product
export const toggleProductPublic = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
