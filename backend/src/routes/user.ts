import { Router } from "express";
import { PrismaClient, User } from "@prisma/client";
import { upload } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../utils/cloudinary";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authenticationJWT } from "../middlewares/auth.middleware";

const router: Router = Router();

const prismaClient = new PrismaClient();

interface MulterRequest extends Request {
    files: {
        [fieldname: string]: Express.Multer.File[];
    };
}

router.post('/sign-up', upload.fields([
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

        let profileImageUrl: string = "https://via.placeholder.com/150";
        
        if (req.files?.profile_img?.[0]?.path) {
            const profileImageLocalPath = req.files.profile_img[0].path;
            const profileImage = await uploadOnCloudinary(profileImageLocalPath);

            if (!profileImage) {
                return res.status(500).json({
                    status: 500,
                    message: "Something went wrong uploading the image to Cloudinary"
                });
            }

            // Use the Cloudinary URL if the image was uploaded successfully
            profileImageUrl = profileImage.url;
        }

        // create a new user
        const user = await prismaClient.user.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
                profile_img: profileImageUrl
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
            });
        }
    
        const tokenSecret: any = process.env.ACCESS_TOKEN_SECRET;
    
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                profileImage: user.profile_img
            },
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
    
        return res
        .status(200)
        .cookie("accessToken", token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            domain: "localhost",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
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

router.get('/sign-out', authenticationJWT, async (req: Request | any, res) => {

    try {
        
        const userId = req.user.id;

        const user = await prismaClient.user.findFirst({
            where: {
                id: userId
            }
        })

        if (!user) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "User not found"
            })
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            domain: "localhost",
        })
        .json({
            status: 200,
            message: "User signed out successfully"
        });

    } catch (error) {
        console.log("Error signing out user", error);
        throw error;
    }

})

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
                id: req.user.id
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

router.delete("/delete", authenticationJWT, async (req: any, res) => {
    
    try {

        const userId = req.user.id;
        
        // const deletedUser = await prismaClient.user.delete({
        //     where: {
        //         id: req.user.id
        //     }
        // })

        const deletedUser = await prismaClient.user.delete({
            where: {
                id: Number(userId)
            }
        });

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

router.get("/all-users", async (req, res) => {
    try {

        const users = await prismaClient.user.findMany({
            include: {
                products: {
                    select: {
                        title: true,
                        description: true,
                        images: true,
                        price: true
                    }
                }
            }
        });

        if (!users) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while fetching all users"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                users,
                message: "Users fetched successfully"
            })
        
    } catch (error) {
        console.log("Error getting all user", error);
        throw error;
    }
})

router.get("/:id", authenticationJWT, async (req, res) => {
    try {

        const userId = req.params.id;

        if (!userId) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "User id missing"
            })
        }

        const user = await prismaClient.user.findFirst({
            where: {
                id: Number(userId)
            },
            include: {
                products: {
                    select: {
                        title: true,
                        description: true,
                        price: true,
                        images: true,
                    }
                }
            }
        })

        if (!user) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while getting user"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            user,
            message: "User fetched successfully"
        })
        
    } catch (error) {
        console.log("Error getting user", error);
        throw error;
    }
})

router.post("/change-profle-image", upload.single("profile_img"),  authenticationJWT, async (req: any, res) => {
    try {

        const userId = req.user.id;

        if (!userId) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "User id is missing"
            })
        }

        if(!req.file) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "file not found!"
            })
        }
        
        const profileImageLocalPath = req.file.path;

        if(!profileImageLocalPath) {
            console.log("Profile image local path not found!");
        }

        const profileImage = await uploadOnCloudinary(profileImageLocalPath);
        
        if (!profileImage?.url) {
            return res
            .status(501)
            .json({
                message: "Something went wrong while uploading profile image"
            })
        }

        const user = await prismaClient.user.update({
            where: {
                id: Number(userId)
            },
            data: {
                profile_img: profileImage.url
            }
        })

        if (!user) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "something went wrong while updating profile image"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            user,
            message: "Profile image updated successfully"
        })

    } catch (error) {
        console.log("Error changing profile image", error);
        throw error;
    }
})

export default router;