import { PrismaClient } from "@prisma/client";
import { NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"

const prismaClient = new PrismaClient();

const isJwtPayload = (token: string | JwtPayload): token is JwtPayload => {
    return (token as JwtPayload).id !== undefined;
};

const authenticationJWT = async (req: Request | any, res: Response | any, next: NextFunction | any) => {
    try {
        
        const encodedToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        console.log("encoded token:", encodedToken);

        if (!encodedToken) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "Unauthorized request"
            })
        }

        const tokenSecret: any = process.env.ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(encodedToken, tokenSecret);

        // @ts-ignore
        if(!isJwtPayload(decodedToken)){
            if (!isJwtPayload(decodedToken)) {
                return res.status(403).json({
                  status: 403,
                  message: "Invalid access token <isJwtPayload-check>"
                });
            }
        }


        const user = await prismaClient.user.findFirst({
            where: {
                id: decodedToken.id
            }
        })

        if (!user) {
            return res.status(403).json({
                status: 403,
                message: "Invalid access token <user-check>"
            });
        }

        req.user = user;

        next()

    } catch (error) {
        console.log("Error in authetication middleware: ", error);
        throw error;
    }
}

export { authenticationJWT };