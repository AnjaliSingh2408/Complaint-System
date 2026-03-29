import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Complaint } from "../models/complaint.models.js";

const getUserProfile = asyncHandler(async(req,res,next)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user:req.user},
            "User profile fetched successfully!!"
        )
    );
});

const editProfile = asyncHandler(async(req,res,next)=>{
    const {fullName,email}=req.body

    if(!fullName.trim() || !email.trim()){
        throw new ApiError(400,"Enter the Fullname and email!!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "User profile edited successfuly!!"
        )
    )

});


const getMyStats = asyncHandler(async(req,res,next)=>{
    const user = req.user
    if(!user){
        throw new ApiError(404,"User not found!!")
    }

    const userId=user._id;
    const totalComplaints = await Complaint.countDocuments({submittedBy:userId})
    const pendingComplaints = await Complaint.countDocuments({submittedBy:userId, complaintStatus:"Pending"});
    const resolvedComplaints = await Complaint.countDocuments({submittedBy:userId, complaintStatus:"Resolved"});
    const inProgressComplaints = await Complaint.countDocuments({submittedBy:userId, complaintStatus:"In Progress"});  
    const assignedComplaints = await Complaint.countDocuments({submittedBy:userId, complaintStatus:"Assigned"});

    const pendingPercentage = (totalComplaints !== 0) ? (pendingComplaints / totalComplaints) * 100 : 0;
    const resolvedPercentage = (totalComplaints !== 0) ? (resolvedComplaints / totalComplaints) * 100 : 0;
    const inProgressPercentage = (totalComplaints !== 0) ? (inProgressComplaints / totalComplaints) * 100 : 0;
    const assignedPercentage = (totalComplaints !== 0) ? (assignedComplaints / totalComplaints) * 100 : 0;

    const latestComplaint = await Complaint.findOne({submittedBy:userId})
        .sort({createdAt:-1})

    const stats = {
        totalComplaints: totalComplaints||0,
        pendingComplaints: pendingComplaints||0,
        resolvedComplaints: resolvedComplaints||0,
        inProgressComplaints: inProgressComplaints||0,
        assignedComplaints: assignedComplaints||0,
        pendingPercentage: pendingPercentage.toFixed(2),
        resolvedPercentage: resolvedPercentage.toFixed(2),
        inProgressPercentage: inProgressPercentage.toFixed(2),
        assignedPercentage: assignedPercentage.toFixed(2),
        latestComplaint: latestComplaint || null
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {stats},
            "User stats fetched successfully!!"
        )
    );

});

// const needHelp = asyncHandler(async(req,res,next)=>{
//     //chat would use web sockets
//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             {chatEndPoint : "/chat/support"},
//             "Redirecting to chat support"
//         )
//     );
// });

const logoutUser = asyncHandler(async(req,res,next)=>{
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {new:true}
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully!!"
        )
    );
});


export {getUserProfile,
    editProfile,
    getMyStats,
    logoutUser
}