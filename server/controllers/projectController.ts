import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";

export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string;
  let isCreditDeducted = false;

  try {
    const { userId } = req.auth();
    const {
      name = "New Project",
      aspectRatio,
      productName,
      userPrompt,
      productDescription,
      targetLength = 5,
    } = req.body;

    const images: any = req.files;

    if (!images || images.length < 2 || !productName) {
      return res
        .status(400)
        .json({
          message: "Please upload at least 2 images and provide product name",
        });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.credits < 5) {
      return res.status(400).json({ message: "Insufficient Credits" });
    }

    // Deduct credits for image creating
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: 5 },
      },
    });
    isCreditDeducted = true;

    // Upload images to cloudinary
    let uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    // Create project
    const product = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        isGenerating: true,
      },
    });
    tempProjectId = product.id;

    res.status(201).json({ project: product });
  } catch (error: any) {
    // If credit was deducted but project creation failed, refund the credits
    if (isCreditDeducted) {
      try {
        const { userId } = req.auth();
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: { increment: 5 },
          },
        });
      } catch (refundError) {
        Sentry.captureException(refundError);
      }
    }
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};


export const createVideo = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
export const getAllPublishedProjects = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
export const deleteProject = async (req: Request, res: Response) => {
  try {
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
