import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticationJWT } from "../middlewares/auth.middleware";

const router: Router = Router();

const prismaClient: PrismaClient = new PrismaClient();


router.post("/add-review/product/:id", authenticationJWT, async (req: any, res) => {
    try {

        const { review_content } = req.body;
        const productId = req.params.id;
        const reviewerId = req.user.id;

        if (!( review_content || productId || reviewerId)) {
            return res
            .status(401)
            .json({
                message: "Review content, productId, or reviewerId is missing"
            })
        }

        const review = await prismaClient.review.create({
            data: {
                review_content: review_content,
                product: {
                    connect: {
                        id: Number(productId)
                    }
                },
                reviewer: {
                    connect: {
                        id: Number(reviewerId)
                    }
                }
            }
        })

        if (!review) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while adding review"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                message: "Review added successfully"
            })
        
    } catch (error) {
        console.log("Error adding review", error);
        throw error;
    }
})

router.put("/edit-review/producct/:productId/review/:reviewId", authenticationJWT, async (req: any, res) => {
    try {

        const { review_content } = req.body;
        const productId = req.params.productId;
        const reviewId = req.params.reviewId;
        const reviewerId = req.user.id;

        if (!review_content) {
            return res
            .status(402)
            .json({
                message: "Review content is missing"
            })
        }

        if (!( productId || reviewId || reviewerId )) {
            return res.
            status(403)
            .json({
                message: "productId, reviewId, or reviewerId is missing"
            })
        }

        const editedReview = await prismaClient.review.update({
            where: {
                id: Number(reviewId),
                product_id: Number(productId)
            },
            data: {
                review_content: review_content
            }
        })

        if (!editedReview) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while editing review"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                message: "Review edited successfully"
            })

    } catch (error) {
        console.log("Error updating review", error);
        throw error;
    }
})

router.delete("/delete-review/:id", authenticationJWT, async (req: any, res) =>{
    try {
        
        const reviewId = req.params.id;
        const userId = req.user.id;

        if (!( reviewId || userId )) {
            return res
            .status(402)
            .json({
                message: "reviewId or userId is missing"
            })
        }

        const review = await prismaClient.review.delete({
            where: {
                id: Number(reviewId),
                reviewer_id: Number(userId)
            }
        })

        if (!review) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while deleting review"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            message: "Review deleted successfully"
        })

    } catch (error) {
        console.log("Error deleting review", error);
        throw error;
    }
})

router.get("/get-review/:id", authenticationJWT, async (req, res) => {
    try {

        const reviewId = req.params.id;

        if (!reviewId) {
            return res
            .status(401)
            .json({
                message: "Review id is missing"
            })
        }

        const review = await prismaClient.review.findFirst({
            where: {
                id: Number(reviewId)
            },
            include: {
                reviewer: true
            }
        })

        if (!review) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while getting review"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            review,
            message: "Review fetched successfully"
        })
        
    } catch (error) {
        console.log("Error getting review", error);
        throw error;
    }
})

router.get("/get-all-reviews", authenticationJWT, async (req, res) => {
    try {

        const allReviews = await prismaClient.review.findMany({
            include: {
                reviewer: true
            }
        });

        if (!allReviews) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while getting all reviews"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                allReviews,
                message: "All reviews fecthed successfully"
            })
        
    } catch (error) {
        console.log("Error getting all reviews", error);
        throw error;
    }
})

export default router;