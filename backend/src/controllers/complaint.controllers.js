import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Complaint } from "../models/complaint.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerComplaint = asyncHandler(async(req,res,next)=>{
    //pehle check karna hai ki the req is made by a citizen
    //check if the citizen is regiestered or not
    //then we hav e to check if the req body,ie.,the complaint has a title and a description
    //if the complaint has an image we have to save  it
    //there can be multiple images in a complan we have to set the limit of images to 5
    //then we will also have to mark the initial status of that compliant as "pending"
    //we will have to use AI to categorize the type of the complaint
    //also we have to assign priority to the complaint using AI
    //save the complaint in the db
    const { title, description, latitude, longitude,address} = req.body;
    if(
        [title,description,latitude, longitude,address].some((field) => field?.trim()=== "")
    ){
        throw new ApiError(400,"All fields are required!!")//can also check separately for title, dec and location
    }
     
    let imageUrls=[]
    if(req.files && req.files>0){
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path)
            if(uploaded?.url){
                imageUrls.push(uploaded.url)
            }
        }
    }

    const complaintData={
        title,
        description,
        images:imageUrls,
        status:"pending",
        location:{
            address,
            type:"Point",
            coordinates:[Number(longitude), Number(latitude)]
        },
        submittedBy:req.user._id
    };
    //save the complaint in the db
    const complaint = await Complaint.create(complaintData)

    if(!complaint){
        throw new ApiError(500,"Failed to register complaint!!")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {complaint:complaint},
            "Complaint registered successfully!!"
        )
    )

});

const assignComplaintToStaff = asyncHandler(async(req,res,next)=>{
    //we have to assign complaints
    //we will check if the usr accessing this route is admin or not
    //if not admin dismiss
    //admin will get all the pending complaints and the list of staffs
    //complaint document mein staff ki id daal denge
    //alert the staff about the new assignment
    //update the status of the complaint to "In Progress"

    const{ complaintId } = req.params;
    const{ staffId } = req.body;
    if(!staffId){
        throw new ApiError(400,"Staff id is required!!")
    }
    if(!complaintId){
        throw new ApiError(400,"Complaint id is required!!")
    }

    const complaint = await Complaint.findById(complaintId)
    if(!complaint){
        throw new ApiError(404,"Complaint not found!!")
    }

    const staff = await User.findById(staffId)
    if(!staff || staff.role!=="staff"){
        throw new ApiError(400,"Invalid Staff!!")
    }

    complaint.assignedTo=staffId;
    complaint.complaintStatus="In Progress";

    await complaint.save();
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {complaint},
            "Complained assigned to staff successfully!!"
        )
    );  
});


export {registerComplaint,
    assignComplaintToStaff,
}