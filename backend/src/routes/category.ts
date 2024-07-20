import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticationJWT } from "../middlewares/auth.middleware";
import { categories } from "../utils/categoryArray";
import { Category } from "../utils/categoryArray";

const router: Router = Router();

const prismaClient: PrismaClient= new PrismaClient();

router.post("/add-categories", async (req, res) => {
    try {
        
        async function createCategories(){
            for (const category of categories) {
                await prismaClient.category.create({
                    data: {
                        name: category.name
                    }
                })
            }
        }

        await createCategories()
        .then((x) => {
            console.log("Categories created");
            return res
            .status(200)
            .json({
                message: "Categories created successfully"
            })
        })
        .catch((err) => {
            console.log("categories are not creating");
            return res
            .status(501)
            .json({
                message: "Something went wrong whuile creating categories"
            })
        })

         
    } catch (error) {
        console.log("Error adding categories", error);
        throw error;
    }
})

router.get("/get-category", async (req, res) => {
    try {
        
        async function getCategoris() {
            return await prismaClient.category.findMany();
        }

        await getCategoris()
        .then((x) => {
            return res
            .status(200)
            .json({
                message: "Categories fetched successfully",
                categories: x
            })
        })
        .catch((err) => {
            return res
            .status(500)
            .json({
                message: "fetching failed"
            })
        })

    } catch (error) {
        console.log("Error getting categories", error);
        throw error;
    }
})

export default router;