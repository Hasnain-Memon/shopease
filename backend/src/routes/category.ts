import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticationJWT } from "../middlewares/auth.middleware";

const router: Router = Router();

const prismaClient: PrismaClient= new PrismaClient();

router.post("/add-category", authenticationJWT, async (req, res) => {
    try {
        
        const { name } = req.body;

        if (!name) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "name is required"
            });
        }

        const category = await prismaClient.category.create({
            data: {
                name: name
            }
        })

        if (!category) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while creating category"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                category,
                message: "Category created successfully"
            })

    } catch (error) {
        console.log("Error adding category");
        throw error;
    }
})

export default router;