import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";;
import { asyncHandler} from "../utils/asyncHandler.js";;
import jwt from  "jsonwebtoken";


export const verifyJWT= asyncHandler(async(req,_,next)=>{
    try{
        const token=req.cookies?.accesSToken || req.header("Authorization")?.replace("Bearer ","")
        if(!token){
            throw new ApiError(401,"Unauthorized request!!")
        }

        const decodedToken =  jwt.verify(token,process.env.ACCES_TOKEN_SECRET)

        const user = User.findById(decodedToken._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        if(!user.isActive){
            throw new ApiError(403,"Your account has been deactivated, please contact support!!")
        }
        req.user=user;
        next();
    }
    catch(error){
        throw new ApiError(401, error?.message || "Invalid Access Token!!")
    }
})