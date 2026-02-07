import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"

export const authorize =  asyncHandler(async(req,_,next)=>{
        try{
            (...allowedRoles)=>{
            if(!req.user || !req.user.role){
                throw new ApiError(403,"Unauthorized request!!")
            }

            if(!allowedRoles.includes(req.user.role)){
                throw new ApiError(403,"Access denied!!")
            }
            next();
            }
        }catch(error){
            throw new ApiError(403, error?.message || "Access denied!!")
        }
})
