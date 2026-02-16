import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import connectDB from "./db/index.js";
import { app } from "./app.js";
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Ther port is running onP: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(`DB connection error: ${err}`);
});