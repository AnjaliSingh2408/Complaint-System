import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Complaint } from "../models/complaint.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendPushNotification } from "../utils/sendNotification.js";
import { classifyComplaint } from "../services/ai.services.js";
import { getIO } from "../utils/socket.js";

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


    const aiPromise = classifyComplaint(title, description);

    const timeoutPromise = new Promise((resolve) =>
        setTimeout(() =>
            resolve({ category: "General", priority: "Medium" }), 3000)
    );

    const { category, priority } = await Promise.race([
        aiPromise,
        timeoutPromise
    ]);
     
    let imageUrls=[]
    if(req.files && req.files>0){
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path)
            if(uploaded?.url){
                imageUrls.push(uploaded.url)
            }
        }
    }

    const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();

    const complaintData={
        title,
        description,
        images:imageUrls,
        category,
        priority,
        status:"Pending",
        location:{
            address,
            type:"Point",
            coordinates:[Number(longitude), Number(latitude)]
        },
        submittedBy:req.user._id,
        resolutionOTP:generatedOTP
    };
    //save the complaint in the db
    const complaint = await Complaint.create(complaintData)

    if (req.user.email) {
        await sendEmail(
            req.user.email,
            "Your Complaint OTP",
            `Your complaint "${complaint.title}" has been registered. When a staff member comes to resolve your issue, please provide them with this OTP: ${generatedOTP}. Do not share it until the issue is entirely fixed!`
        );
    }

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
    complaint.status="Assigned";

    await sendPushNotification(
        staff.fcmToken,
        "New Complaint Assigned",
        `Complaint "${complaint.title}" assigned to you`
    );

    await complaint.save();

    const io = getIO();
    io.to(staffId.toString()).emit("complaint_assigned",{
        complaintId:complaint._id,
        message:"A new complaint has been assigned to you!!"
    });

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

const getComplaints=asyncHandler(async(req,res,next)=>{
    //if role === admin → return all complaints
    //if role === staff → return assigned complaints
    //if role === citizen → return submitted complaints

    const userId = req.user._id;
    const role = req.user.role;

    let complaints;
    
    if(role==="admin"){
        complaints = await Complaint.find()
        .populate("submittedBy","fullName email")
        .populate("assignedTo","fullName email")
    }
    else if(role==="staff"){
        complaints = await Complaint.find({assignedTo:userId})
        .populate("submittedBy","fullName email")
    }
    else if(role==="citizen"){
        complaints = await Complaint.find({submittedBy:userId})
        .populate("assignedTo","fullName email")
    }
    else{
        throw new ApiError(403,"Unauthorized request!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {complaints},
            "Complaints fetched successfully!!"
        )
    )
});


const updateComplaintStatus = asyncHandler(async(req,res,next)=>{
    //jab staff acknowledges an assigned complaint then he/she changes the status to "In Progress"
    //jab staff resolves the complaint then he/she changes the status to "Resolved"
    const {complaintId} =req.params;
    const {status} = req.body;
    
    if(!complaintId){
        throw new ApiError(400,"Complaint id is required!!")
    }
    const complaint = await Complaint.findById(complaintId);
    if(!complaint){
        throw new ApiError(404,"Complaint not found!!")
    }

    if(req.user.role !== "staff"){
        throw new ApiError(403,"Unauthorized request!!")
    }
    if(complaint.assignedTo.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Complaint not assigned to you!!")
    }

    const allowedStatus=["In Progress","Resolved"];
    if(!allowedStatus.includes(status)){
        throw new ApiError(400,"Invalid status!!")
    }

    complaint.status=status;

    if(status==="In Progress"){
        complaint.acknowledgedAt = new Date();
    }
    if(status==="Resolved"){

        if(!citizenOTP){
            throw new ApiError(400,"Correct citizen OTP is required!!")
        }

        await sendPushNotification(
        citizen.fcmToken,
        "Complaint Resolved",
        `Your complaint "${complaint.title}" has been resolved`
        );
        complaint.resolvedAt = new Date();
        complaint.resolutionOTP = null; 
    }
    await complaint.save();

    if(status==="Resolved"){
        const io = getIO();
        io.to(complaint.submittedBy.toString()).emit("complaint_resolved",{
            complaintId:complaint._id,
            message:"Your complaint has been resolved!!"
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {complaint},
            "Complaint status updated successfully!!"
        )
    );
});

const editComplaint = asyncHandler(async(req,res,next)=>{
    const {complaintId} = req.params;
    const {citizen} = req.user._id;

    if(!complaintId){
        throw new ApiError(400,"Complaint id is required!!")
    }

    const complaint = await Complaint.findById(complaintId);
    if(!complaintId){
        throw new ApiError(404,"Complaint not found!!")
    }

    if(req.user.role !== "citizen"){
        throw new ApiError(403,"Only citizens can edit complaints!!")
    }

    if(complaint.submittedBy.toString() !== citizen._id.toString()){
        throw new ApiError(403,"Unauthorized request!!")
    }

    if(complaint.status !== "pending"){
        throw new ApiError(400, "This complaint can no longer be edited!!")
    }

    complaint.title = req.body.title || complaint.title;
    complaint.description = req.body.description || complaint.description;
    
        if (req.body.address) {
        // Correctly update the nested location properties
        complaint.location.address = req.body.address;
        
        // If they provided a new address, they must also provide the new GPS coordinates
        if (req.body.longitude && req.body.latitude) {
            complaint.location.coordinates = [Number(req.body.longitude), Number(req.body.latitude)];
        }
    }


    if(req.body.removeImages){
        complaint.images = complaint.images.filter(
            img => !req.body.removeImages.includes(img)
        )
    }

    if(req.files && req.files>0){
        const newImageUrls = [];
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path)
            if(uploaded?.url){
                newImageUrls.push(uploaded.url)
            }
        }
        complaint.images = complaint.images.concat(newImageUrls).slice(0,5)
    }

    await complaint.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {complaint},
            "Complaint updated successfully!!"
        )
    );
});

const deleteComplaint = asyncHandler(async(req,res,next)=>{
//admin can delete any complaint
//user can delete a complaint only if it is pending
    const {complaintId} = req.params;
    const user =req.user._id;

    const complaint = await Complaint.findById(complaintId);
    if(!complaint){
        throw new ApiError(404,"Complaint not found!!")
    }

    if(req.user.role === "Admin"){
        await complaint.deleteOne();
    }else if(req.user.role === "Citizen"){
        if(complaint.submittedBy.toString() !== req.user._id.toString()){
            throw new ApiError(403,"You cannot delete a complaint not registered by you!!")
        }
        //delete logic
        await complaint.deleteOne();
    }else{
        throw new ApiError(403,"Unauthorized request!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {complaint},
            "Complaint deleted successfully"
        )
    );
});


export {registerComplaint,
    assignComplaintToStaff,
    getComplaints,
    updateComplaintStatus,
    editComplaint,
    deleteComplaint
}