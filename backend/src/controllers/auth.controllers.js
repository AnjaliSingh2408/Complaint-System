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

//login user same for all roles
const loginUser = asyncHandler(async(req,res,next)=>{
    const {email,username, password } = req.body;
    if(!username || !email){
        throw new ApiError(400,"Username and email are required!!")
    }
    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not exist!!")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials!!")
    }
    const {accessToken, refreshToken} = await generateTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookies("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken, refreshToken
            },
            "User logged in successfully!!"
        )
    )
})



export {registerCitizen,
        loginUser,
}