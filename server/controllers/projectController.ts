import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import path from "path";
import ai from "../configs/ai.js";

const loadImage = (path: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
};

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
      return res.status(400).json({
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

    const model = "gemini-3-pro-image-preview";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["image"],
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    //images to base64 structure for ai model

    const img1base64 = loadImage(images[0].path, images[0].mimeType);
    const img2base64 = loadImage(images[1].path, images[1].mimeType);

    const prompt = {
      text: `Combine the person and product into relastic photo ${userPrompt}`,
    };



//generate the image using ai model
const response:any=await ai.models.generateContent({
    model,
    contents:[img1base64,img2base64,prompt],
    config:generationConfig,

})

if(!response?.candidates?.[0]?.content?.parts){
    throw new Error("No image generated")
}

const parts=response.candidates[0].content.parts;
let finalBuffer:Buffer | null=null;

for(const part of parts){
    if(part.inlineData){
        finalBuffer=Buffer.from(part.inlineData.data,"base64")
    }
}

if(!finalBuffer){
    throw new Error("Failed to generate image")

}

const base64Image=`data:image/png;base64,${finalBuffer.toString("base64")}`

const uploadResult=await cloudinary.uploader.upload(base64Image,{
    resource_type:"image"})


await prisma.project.update({
    where:{id:product.id},
    data:{
        generatedImage:uploadResult.secure_url,
        isGenerating:false,
    }
})


    res.status(201).json({ projectId: product.id });
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
