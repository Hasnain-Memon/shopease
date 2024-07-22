import express from "express"
import cookieParser from 'cookie-parser'
import cors from "cors"
import dotenv from "dotenv"
import userRoute from "./routes/user"
import productRoute from "./routes/product"
import categoryRoute from "./routes/category"
import reviewRoute from "./routes/review";

dotenv.config({
    path: "./.env"
})

const app = express();
const port = 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// configuring middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/user', userRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/category', categoryRoute);
app.use('/api/v1/review', reviewRoute);

app.listen(port, () => {
    console.log(`app is listening on ${port}`);
})