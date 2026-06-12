import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        console.log(accessToken);
        console.log(refreshToken);

        return {accessToken, refreshToken}


    } catch {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerCitizen = asyncHandler(async(req,res,next)=>{
    const {fullName,username, email, password, phoneNo} = req.body;

    if([fullName,username,email,password,phoneNo].some((field)=> String(field)?.trim()==="")){
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
        phoneNo,
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
    const {email, username, password} = req.body;
    if(!username && !email){
        throw new ApiError(400,"Username or email is required!!")
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
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options ={
        httpOnly:true,
        secure:true,
        sameSite: "none"
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        }
    
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const logoutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly:true,
        secure:true,
        sameSite: "none"
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully!!"
        )
    )
})


export {registerCitizen,
        loginUser,
        refreshAccessToken,
        logoutUser,
}
