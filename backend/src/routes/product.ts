import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { authenticationJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { uploadOnCloudinary } from "../utils/cloudinary";

const router: Router = Router();

const prismaClient = new PrismaClient();

interface MulterRequest extends Request {
    files: {
        [fieldname: string]: Express.Multer.File[];
    };
}

router.post('/add-product', upload.array("product_img", 8), authenticationJWT, async (req: MulterRequest | any, res) => {
    try {

        const { title, description, address, price, category } = req.body;

        if ([title, description, address, price, category].some((field) => field?.trim() === "")) { 
            return res
            .status(402)
            .json({
                status: 402,
                message: "All fields are required"
            })
        }

        console.log("Req.files: ", req.files);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "No files were uploaded"
            });
        }

        const uploadedImageUrls = [];
        for (const file of req.files) {
            try {
                const productImageLocalPath = file.path;
                console.log("Uploading image from path:", productImageLocalPath);
                
                const productImageObj = await uploadOnCloudinary(productImageLocalPath);
                const productImageURL = productImageObj?.url;

                if (productImageURL) {
                    uploadedImageUrls.push(productImageURL);
                } else {
                    console.error("Image upload failed for file:", file.originalname);
                }
            } catch (uploadError) {
                console.error("Error uploading image:", uploadError);
            }
        }

        if (uploadedImageUrls.length === 0) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while uploading product image"
            })
        }

        const user: any = await prismaClient.user.findFirst({
            where: {
                id: req.user.id
            }
        })

        const categorry = await prismaClient.category.findFirst({
            where: {
                name: category
            }
        });

        if (!categorry) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Category not found"
            })
        }

        if (!user) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Product owner/user not found"
            })
        }

        const product: any = await prismaClient.product.create({
            data: {
                title: title,
                description: description,
                images: uploadedImageUrls,
                address: address,
                price: price,
                owner: {
                    connect: {
                        id: user.id
                    }
                },
                category: {
                    connect: {
                        id: categorry.id
                    }
                }
            }
        });

        if (product.length === 0) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Products not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            product,
            message: "Product added successfully"
        })

    } catch (error) {
        console.log("Error adding product", error);
        throw error;
    }
})

router.delete("/remove-product/:id", authenticationJWT, async (req, res) => {
    try {

        const productId = req.params.id;

        if (!productId) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "Product id is missing"
            })
        }

        const product = await prismaClient.product.delete({
            where: {
                id: Number(productId)
            }
        });

        if (!product) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while removing product"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            message: "Product removed successfully"
        })

    } catch (error) {
        console.log("Error removing product", error);
        throw error;
    }
})

router.get("/all-products", authenticationJWT, async (req, res) => {
    try {

        const { page = 1, limit = 10, sortBy, sortType }: any = req.query;

        const parsedLimit = parseInt(limit);
        const pageSkip = (page - 1) * parsedLimit;
        const sortStage: any = {};
        sortStage[sortBy] = sortType === 'asc' ? "asc" : "desc";

        const products = await prismaClient.product.findMany({
            include: {
                reviews: {
                    select: {
                        review_content: true,
                        created_at: true,
                        reviewer: true
                    }
                }
            },
            skip: pageSkip,
            take: parsedLimit,
            orderBy: sortStage
        });

        if (products.length === 0) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Products not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            products,
            message: "Products fetched successfully"
        })
        
    } catch (error) {
        console.log("Error getting all products", error);
        throw error;
    }
})

router.get("/get-product/:id", authenticationJWT, async(req, res) => {
    try {
        
        const productId = req.params.id;

        if (!productId) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "Product id is missing"
            })
        }

        const product: any = await prismaClient.product.findFirst({
            where: {
                id: Number(productId)
            },
            include: {
                reviews: {
                    select: {
                        review_content: true,
                        created_at: true,
                        reviewer: true
                    }
                }
            }
        });

        if (product.length === 0) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Products not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            product,
            message: "Product fetched successfully"
        })

    } catch (error) {
        console.log("Error getting product", error);
        throw error;
    }
})

router.put("/update-product/:id", authenticationJWT, async (req, res) => {
    try {
        
        const productId = req.params.id;
        const { title, description, price } = req.body;

        if ([title, description, price].some((field) => field?.trim() === "")) {
            return res
            .status(400)
            .json({
                status: 400,
                message: "All fields are required"
            })
        }

        if (!productId) {
            return res
            .status(401)
            .json({
                status: 401,
                message: "Product id is missing"
            })
        }

        const updatedProduct = await prismaClient.product.update({
            where: {
                id: Number(productId)
            },
            data: {
                title,
                description,
                price,
            }
        })

        if (!updatedProduct) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while updating product"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            updatedProduct,
            message: "Product updated successfully"
        })

    } catch (error) {
        console.log("Error updating product", error);
        throw error;
    }
})

router.post("/update-product-images/:id", upload.array("product_img", 8), authenticationJWT, async (req: MulterRequest | any, res) => {
    try {
        
        const userId = req.user.id;
        const productId = req.params.id;

        if (!(userId | productId)) {
            return res
            .status(401)
            .json({
                message: "userId/productId is missing"
            })
        }

        const uploadImagesUrls: string[] = [];
        for (const file of req.files) {
            try {
                
                const productImageLocalPath = file.path;

                const productImageObj = await uploadOnCloudinary(productImageLocalPath);
                const productImageURL = productImageObj?.url;

                if (productImageURL) {
                    uploadImagesUrls.push(productImageURL);
                } else {
                    console.error("Image upload failed for file");
                }

            } catch (error) {
                console.log("Error uploading images", error);
                throw error;
            }
        }
        
        if (uploadImagesUrls.length === 0) {
            return res
            .status(501)
            .json({
                status: 501,
                message: "Something went wrong while uploading product images on cloudinary"
            })
        }

        const product = await prismaClient.product.update({
            where: {
                id: Number(productId),
                owner_id: Number(userId)
            },
            data: {
                images: uploadImagesUrls
            }
        })

        if (!product) {
            return res
            .status(500)
            .json({
                status: 500,
                message: "Something went wrong while updating product images"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            product,
            message: "Product images updated successfully"
        })

    } catch (error) {
        console.log("Error updating product images", error);
        throw error;
    }
})

router.get("/get-user-products/:id", authenticationJWT, async (req, res) => {
    try {

        const { page = 1, limit = 10, sortBy, sortType }: any = req.query;
        const parsedLimit = parseInt(limit);
        const pageSkip = (page - 1) * parsedLimit;
        const sortStage: any = {};
        sortStage[sortBy] = sortType === 'asc' ? "asc" : "desc";
        
        const userId = req.params.id;

        if (!userId) {
            return res
            .status(401)
            .json({
                message: "User id is missing"
            })
        }

        const products = await prismaClient.product.findMany({
            where: {
                owner_id: Number(userId)
            },
            skip: pageSkip,
            take: parsedLimit,
            orderBy: sortStage
        })

        if (products.length === 0) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Products not found"
            })
        }

        return res
        .status(200)
        .json({
            status: 200,
            products,
            message: "Products fetched successfully"
        })
    
    } catch (error) {
        console.log("Erro getting all products from user", error);
        throw error;
    }
})

router.get("/get-products-by-query", authenticationJWT, async (req, res) => {
    try {

        const searchTerm  = req.query.q || '';

        if (!searchTerm) {
            return res
            .status(402)
            .json({
                message: "search term is unavailable"
            })
        }

        const products = await prismaClient.product.findMany({
            where: {
                title: {
                    contains: String(searchTerm),
                    mode: "insensitive"
                }
            },
            include: {
                reviews: {
                    select: {
                        review_content: true,
                        created_at: true,
                        reviewer: true
                    }
                }
            }
        })

        if (products.length === 0) {
            return res
            .status(404)
            .json({
                status: 404,
                message: "Products not found"
            })
        }

        return res
            .status(200)
            .json({
                status: 200,
                products,
                message: "Products based on search term fetched successfully"
            })
        
    } catch (error) {
        console.log("Error getting products based on query", error);
        throw error;
    }
})

export default router;