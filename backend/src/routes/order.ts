import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticationJWT } from "../middlewares/auth.middleware";

const router: Router = Router();

const prismaClient: PrismaClient = new PrismaClient();

// untested
router.post("/place-order/product/:id", authenticationJWT, async (req: any, res) => {
    try {

        const { fullName, mobileNumber, province, city, area, address, landmark } = req.body;
        const userId = req.user.id;
        const productId = req.params.id;

        if (!(userId || productId)) {
            return res
            .status(401)
            .json({
                message: "User id or product id is missing"
            })
        }

        if ([ fullName, mobileNumber, province, city, area, address, landmark ].some(field => field?.trim() === "")) {
            return res
            .status(400)
            .json({
                message: "All fields are required"
            })
        }

        const order = await prismaClient.order.create({
            data: {
                full_name: fullName,
                mobile_number: mobileNumber,
                province,
                city,
                area,
                address,
                landmark,
                order_status: ["FulFilled"],
                buyer: {
                    connect: {
                        id: Number(userId)
                    }
                },
                product: {
                    connect: {
                        id: Number(productId)
                    }
                }
            }
        })
        
    } catch (error) {
        console.log("Error placing order", error);
        throw error;
    }
})

export default router;

// NOT SURE ABOUT THESE ROUTES