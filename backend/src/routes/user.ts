import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../utils/cloudinary";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { UploadedFile } from "express-fileupload";

const router = Router();

const prismaClient = new PrismaClient();

router.post('/sign-up',upload.fields([
    {
        name: "profile_img",
        maxCount: 1
    }
]), async (req, res) => {
    try {
        // get data from the user
        const { username, email, password} = req.body;
    
        // check whether the data is correct or not
        if (
            [email, username,  password].some((field) =>
            field?.trim() === "")
        ) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "All fields are required"
            });
        }
    
        // check whether the user already exists or not
        const existingUser = await prismaClient.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });
    
        if (!existingUser) {
            return res
            .status(402)
            .json({
                statu: 402,
                message: "User already exists with this email or username"
            })
        }
    
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // upload file on cloudinary
        const profileImageLocalPath = req.files?.profile_img[0].path;
        const profileImage = await uploadOnCloudinary(profileImageLocalPath);
    
        if (!profileImage) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong uploading image on cloudinary"
            })
        }
        // create a new user
        const user = await prismaClient.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                profile_img: profileImage.url
            }
        })

        if (!user) {
            return res
            .status(502)
            .json({
                status: 502,
                message: "Something went wrong while creating user"
            })
        }

        // generate access token
        const tokenSecret: any = process.env.ACCESS_TOKEN_SECRET;

        const token = jwt.sign(
            { id: user.id },
            tokenSecret
        );

        if (!token) {
            return res
            .status(505)
            .json({
                status: 505,
                message: "access token is not available"
            })
        }

        // return res along with the cookies.

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .json({
            status: 200,
            message: "User registered successfully",
            user
        })
        .cookie("accessToken", token, options);
    } catch (error) {
        console.log("User registeration failed: ", error);
        throw error;
    }
})

export default router;