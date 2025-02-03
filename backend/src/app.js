import express from "express";
import {createServer} from "node:http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketmanager.js";
import cors from "cors";

dotenv.config();
import userRoutes from './routes/usersroutes.js'


const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({limit:"40kb",extended: true}));
app.use("/api/v1/users",userRoutes);

const start = async () => {
    app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected");


    server.listen(app.get("port"), () => {
        console.log("Server is running on port 8000")
    })
}

start();