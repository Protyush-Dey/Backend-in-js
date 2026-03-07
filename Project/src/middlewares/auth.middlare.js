import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js  ";
import jwt from "jsonwebtoken"
export const verifyJWT  = asyncHandler(async(req , res , next)=>{
    try {
        const token = req.cookies?.AccessToken || req.header
        ("Authorization")?.replace("Bearer" , "")
        if (!token) {
            throw new ApiError(410 , "Unauthorized user")
        }
        const decodedToken = await jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401 , "Invalid access")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "Something went wrong when vrify")
    }
})