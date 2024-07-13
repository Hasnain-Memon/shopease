import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../utils/cloudinary";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authenticationJWT } from "../middlewares/auth.middleware";

const router = Router();

const prismaClient = new PrismaClient();

interface MulterRequest extends Request {
    files: {
        [fieldname: string]: Express.Multer.File[];
    };
}
// sign up route
router.post('/sign-up',upload.fields([
    {
        name: "profile_img",
        maxCount: 1
    }
]), async (req: MulterRequest | any, res: Response | any) => {
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
                email: email
            }
        });
    
        if (existingUser) {
            return res
            .status(402)
            .json({
                status: 402,
                message: "User already exists with this email or username"
            })
        }
    
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // upload file on cloudinary
        const profileImageLocalPath = req.files?.profile_img[0]?.path;
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

    } catch (error) {
        console.log("User registeration failed: ", error);
        throw error;
    }
})

// sign in route
router.post('/sign-in', async (req, res) => {
try {
    
        const { email, password } = req.body;
    
        if (!email && !password) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "email and password is missing"
            })
        }
    
        const user = await prismaClient.user.findFirst({
            where: {
                email: email
            }
        })
        
        if (!user) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Invalid email address"
            })
        }
    
        const decodedPassword = await bcrypt.compare(password, user.password);
    
        if (!decodedPassword) {
            return res
            .status(400)
            .json({
                status: 400,
                message: "Incorrect password"
            })
        }
    
        const tokenSecret: any = process.env.ACCESS_TOKEN_SECRET;
    
        const token = jwt.sign(
            { id: user.id },
            tokenSecret,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
        )
    
        if (!token) {
            return res
            .status(403)
            .json({
                status: 403,
                message: "token is missing"
            })
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", token, options)
        .json({
            status: 200,
            user,
            message: "User logged in successfully"
        })
} catch (error) {
    console.log("Error signing user", error);
    throw error;
}

})

// edit usename route
router.put('/edit-username', authenticationJWT, async (req: any, res) => {
    try {
        
        const { username } = req.body;

        if (!username) {
            return res
            .status(400)
            .json({
                status: 400,
                message: "Username is missing"
            })
        }

        const updatedUser = await prismaClient.user.update({
            where: {
                id: req.user?.id
            },
            data: {
                username
            },
        })

        if (!updatedUser) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "updated user not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            user: updatedUser,
            message: "Username updated successfully"
        })

    } catch (error) {
        console.log("Error upadting username", error);
        throw error;
    }
})

// edit password route
router.put('/edit-password', authenticationJWT, async (req: any, res) => {
    
    try {
        
        const { newPassword } = req.body;

        if (!newPassword) {
            return res
            .status(400)
            .json({
                status: 400,
                message: "new password is missing"
            })
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prismaClient.user.update({
            where: {
                id: req.user?.id
            },
            data: {
                password: hashedNewPassword
            }
        })

        if (!updatedUser) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "updated user not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            user: updatedUser,
            message: "Password updated successfully"
        })

    } catch (error) {
        console.log("Error upadting password", error);
        throw error;
    }

})

// delete user route
router.delete("/delete", authenticationJWT, async (req: any, res) => {
    
    try {
        
        const deletedUser = await prismaClient.user.delete({
            where: {
                id: req?.user.id
            }
        })

        return res
        .status(200)
        .json({
            status: 200,
            user: deletedUser,
            message: "User deleted successfully"
        })

    } catch (error) {
         console.log("Error deleting user", error);
        throw error;
    }

})

export default router;