import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js";
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
    const role = user.role;
    let stats = {};

    if (role === "admin") {
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });
        const assignedComplaints = await Complaint.countDocuments({ status: "Assigned" });
        const inProgressComplaints = await Complaint.countDocuments({ status: "In Progress" });
        const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
        const totalStaff = await User.countDocuments({ role: "staff" });
        const totalCitizens = await User.countDocuments({ role: "citizen" });

        stats = {
            totalComplaints,
            pendingComplaints,
            assignedComplaints,
            inProgressComplaints,
            resolvedComplaints,
            totalStaff,
            totalCitizens
        };
    } else if (role === "staff") {
        const assignedComplaints = await Complaint.countDocuments({ assignedTo: userId, status: "Assigned" });
        const resolvedComplaints = await Complaint.countDocuments({ assignedTo: userId, status: "Resolved" });
        const inProgressComplaints = await Complaint.countDocuments({ assignedTo: userId, status: "In Progress" });
        const pendingOTPComplaints = await Complaint.countDocuments({ 
            assignedTo: userId, 
            status: "In Progress", 
            resolutionOTP: { $ne: null, $exists: true } 
        });

        stats = {
            assignedComplaints,
            resolvedComplaints,
            inProgressComplaints,
            pendingOTPComplaints
        };
    } else {
        // Default to citizen
        const totalComplaints = await Complaint.countDocuments({ submittedBy: userId });
        const pendingComplaints = await Complaint.countDocuments({ submittedBy: userId, status: "Pending" });
        const resolvedComplaints = await Complaint.countDocuments({ submittedBy: userId, status: "Resolved" });
        const inProgressComplaints = await Complaint.countDocuments({ submittedBy: userId, status: "In Progress" });  
        const assignedComplaints = await Complaint.countDocuments({ submittedBy: userId, status: "Assigned" });

        const pendingPercentage = (totalComplaints !== 0) ? (pendingComplaints / totalComplaints) * 100 : 0;
        const resolvedPercentage = (totalComplaints !== 0) ? (resolvedComplaints / totalComplaints) * 100 : 0;
        const inProgressPercentage = (totalComplaints !== 0) ? (inProgressComplaints / totalComplaints) * 100 : 0;
        const assignedPercentage = (totalComplaints !== 0) ? (assignedComplaints / totalComplaints) * 100 : 0;

        const latestComplaint = await Complaint.findOne({ submittedBy: userId })
            .sort({ createdAt: -1 });

        stats = {
            totalComplaints: totalComplaints || 0,
            pendingComplaints: pendingComplaints || 0,
            resolvedComplaints: resolvedComplaints || 0,
            inProgressComplaints: inProgressComplaints || 0,
            assignedComplaints: assignedComplaints || 0,
            pendingPercentage: pendingPercentage.toFixed(2),
            resolvedPercentage: resolvedPercentage.toFixed(2),
            inProgressPercentage: inProgressPercentage.toFixed(2),
            assignedPercentage: assignedPercentage.toFixed(2),
            latestComplaint: latestComplaint || null
        };
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

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { users },
            "All users fetched successfully!!"
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

const createStaff = asyncHandler(async (req, res) => {
  const {
   fullName,
   username,
   email,
   password,
   phoneNo,
  } = req.body;

  if (!fullName || !username ||!email ||!password || !phoneNo) {
   throw new ApiError(
    400,
    "All fields required"
   );
  }

  const exists =
   await User.findOne({
    $or: [
     { email },
     { username },
    ],
   });

  if (exists) {
   throw new ApiError(
    400,
    "Staff already exists"
   );
  }

  const staff =
   await User.create({
    fullName,
    username,
    email,
    password,
    phoneNo,
    role: "staff",
   });

  return res
   .status(201)
   .json(
    new ApiResponse(
      201,
      { staff },
      "Staff created successfully"
    )
   );
 });

 const getAllStaff = asyncHandler(async (req, res) => {
  const staffs =
   await User.find({
    role: "staff",
   }).select(
    "fullName email"
   );

  return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      { staffs },
      "Staff fetched"
    )
   );
 });

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
    getAllStaff,
    getAllUsers,
    createStaff,
    logoutUser
}
