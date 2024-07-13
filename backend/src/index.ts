import express from "express"
import userRouter from "./routes/user"
import cookieParser from 'cookie-parser'
import cors from "cors"
import dotenv from "dotenv"

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

app.use('/api/v1/user', userRouter);

app.listen(port, () => {
    console.log(`app is listening on ${port}`);
})