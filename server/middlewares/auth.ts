import { Request, Response, NextFunction } from "express";
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {


    try {

        const { userId } = req.auth();

        if(!userId){
            return res.status(401).json({message:"Unauthorized"})
        }

next();
    } catch (error: any) {
        return res.status(500).json({ message: "Internal Server Error" });
    }


};
