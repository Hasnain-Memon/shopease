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

        createCategories();
         
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

        getCategoris();

    } catch (error) {
        console.log("Error getting categories", error);
        throw error;
    }
})

export default router;