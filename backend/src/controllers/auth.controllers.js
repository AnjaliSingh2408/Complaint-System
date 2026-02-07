import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerCitizen = asyncHandler(async(req,res,next)=>{
    const {fullName,username, email, password} = req.body;

    if([fullName,username,email,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400,"All fields are required!!")
    }
    const existedUser= await User.findOne({$or:[{email},{username}]})
    if(existedUser){
        throw new ApiError(409,"User already exists !!")
    }
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user?._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"User registration failed!!")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})




export {registerCitizen}