import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({path:"./.env"});
connectDB()
.then(()=>{
    app.listen(process.eventNames.PORT || 8000 , ()=>{
        console.log(`Ther port is running onP: ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log(`DB connection error: ${err}`);
});