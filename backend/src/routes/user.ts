import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();

const prismaClient = new PrismaClient();

router.post('/sign-up', (req, res) => {
    // sign-up logic
    
})

export default router;