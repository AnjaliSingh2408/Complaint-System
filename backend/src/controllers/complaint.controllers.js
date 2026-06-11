import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Complaint } from "../models/complaint.models.js";
import { User } from "../models/user.models.js";
import { Message } from "../models/message.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendPushNotification } from "../utils/sendNotification.js";
import { sendEmail } from "../utils/sendEmail.js";
import { classifyComplaint, generateReportAI } from "../services/ai.services.js";
import { getIO } from "../utils/socket.js";
import PDFDocument from "pdfkit";

const registerComplaint = asyncHandler(async(req,res,next)=>{
    //pehle check karna hai ki the req is made by a citizen
    //check if the citizen is regiestered or not
    //then we hav e to check if the req body,ie.,the complaint has a title and a description
    //if the complaint has an image we have to save  it
    //there can be multiple images in a complain we have to set the limit of images to 5
    //then we will also have to mark the initial status of that compliant as "pending"
    //we will have to use AI to categorize the type of the complaint
    //also we have to assign priority to the complaint using AI
    //save the complaint in the db
    const { title, description, latitude, longitude,address} = req.body;
    if (
        !title?.trim() ||
        !description?.trim() ||
        !address?.trim() ||
        latitude === undefined ||
        longitude === undefined
        ) {
        throw new ApiError(
            400,
            "All fields are required!!"
        );
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

     console.log("FILES:", req.files);
     
    let imageUrls=[]
    if(req.files && req.files?.length > 0){
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path)
            if(uploaded?.secure_url){
                imageUrls.push(uploaded.secure_url)
            }
        }
    }

    console.log("UPLOADED IMAGES:", imageUrls);

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

    if(req.user.email){
        await sendEmail(
                req.user.email,
                "Complaint Registered Successfully",
                `Complaint "${complaint.title}" registered successfully.`,
                `
                <h2>Complaint Registered</h2>
                <p>Hello ${req.user.fullName},</p>

                <p>Your complaint has been registered successfully.</p>

                <p><strong>Complaint Title:</strong> ${complaint.title}</p>
                <p><strong>Status:</strong> Pending</p>

                <h3>Your Resolution OTP</h3>
                <p>${generatedOTP}</p>

                <p>Please share this OTP only when the issue is resolved.</p>
                `
            );
    }

    if(req.user.fcmToken){
        await sendPushNotification(
            req.user.fcmToken,
            "Complaint Registered",
            `Complaint "${complaint.title}" registered successfully`
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

    const citizen = await User.findById(complaint.submittedBy);

    if(citizen?.email){
        await sendEmail(
            citizen.email,
            "Staff Assigned To Your Complaint",
            `Staff assigned to complaint "${complaint.title}"`,
            `
            <h2>Complaint Update</h2>

            <p>A staff member has been assigned.</p>

            <p><strong>Complaint:</strong> ${complaint.title}</p>
            <p><strong>Staff:</strong> ${staff.fullName}</p>
            <p><strong>Status:</strong> Assigned</p>
            `
        );
    }

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
    const {status, citizenOTP} = req.body;
    
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

        if(!citizenOTP || citizenOTP !== complaint.resolutionOTP){
            throw new ApiError(400,"Correct citizen OTP is required!!")
        }

        const citizen = await User.findById(complaint.submittedBy);

        if (citizen) {
            citizen.resolutionOTP = null;
            await citizen.save();

            if (citizen.fcmToken) {
                await sendPushNotification(
                    citizen.fcmToken,
                    "Complaint Resolved",
                    `Your complaint "${complaint.title}" has been resolved`
                );
            }
        }
        complaint.resolvedAt = new Date();
        complaint.resolutionOTP = null; 
    }
    await complaint.save();

    const citizen = await User.findById(complaint.submittedBy);

    if(citizen?.email){
        await sendEmail(
            citizen.email,
            `Complaint Status Updated`,
            `Status changed to ${status}`,
            `
            <h2>Complaint Status Update</h2>

            <p>Your complaint status has changed.</p>

            <p><strong>Complaint:</strong> ${complaint.title}</p>
            <p><strong>New Status:</strong> ${status}</p>
            `
        );
    }

if(citizen?.fcmToken){
    await sendPushNotification(
        citizen.fcmToken,
        "Complaint Status Updated",
        `"${complaint.title}" is now ${status}`
    );
}

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
    const citizenId = req.user._id;

    if(!complaintId){
        throw new ApiError(400,"Complaint id is required!!")
    }

    const complaint = await Complaint.findById(complaintId);
    if(!complaint){
        throw new ApiError(404,"Complaint not found!!")
    }

    if(req.user.role !== "citizen"){
        throw new ApiError(403,"Only citizens can edit complaints!!")
    }

    if(complaint.submittedBy.toString() !== citizenId.toString()){
        throw new ApiError(403,"Unauthorized request!!")
    }

    if(complaint.status !== "Pending"){
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

    if(req.files?.length > 0){
        const newImageUrls = [];
        for(const file of req.files){
            const uploaded = await uploadOnCloudinary(file.path)
            if(uploaded?.secure_url || uploaded?.url){
                newImageUrls.push(uploaded.secure_url || uploaded.url)
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
    const complaint = await Complaint.findById(complaintId);
    if(!complaint){
        throw new ApiError(404,"Complaint not found!!")
    }

    if(req.user.role === "admin"){
        await complaint.deleteOne();
    }else if(req.user.role === "citizen"){
        if(complaint.submittedBy.toString() !== req.user._id.toString()){
            throw new ApiError(403,"You cannot delete a complaint not registered by you!!")
        }
        if(complaint.status !== "Pending"){
            throw new ApiError(400,"Only pending complaints can be deleted by citizens!!")
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

const generateResolutionOTP = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    if (!complaintId) {
        throw new ApiError(400, "Complaint ID is required!");
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found!");
    }

    if (req.user.role === "staff" && complaint.assignedTo?.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not assigned to this complaint!");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    complaint.resolutionOTP = otp;
    complaint.status = "In Progress";
    await complaint.save();

    const citizen = await User.findById(complaint.submittedBy);
    if (citizen) {
        citizen.resolutionOTP = otp;
        await citizen.save();

        if (citizen.email) {
            try {
                await sendEmail(
                    citizen.email,
                    "Resolution OTP for your Complaint",
                    `Hello ${citizen.fullName},\n\nYour complaint "${complaint.title}" has its resolution OTP generated. Please share this OTP with the staff member: ${otp}.\n\nThank you!`
                );
            } catch (err) {
                console.error("Failed to send resolution email:", err.message);
            }
        }
    }

    console.log(`[OTP GENERATED] Complaint: ${complaintId}, OTP: ${otp}, Citizen: ${citizen?.email}`);

    return res.status(200).json(
        new ApiResponse(200, { otp }, "Resolution OTP generated successfully!")
    );
});

const generateComplaintReport = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;
    if (!complaintId) {
        throw new ApiError(400, "Complaint ID is required!");
    }

    const complaint = await Complaint.findById(complaintId)
        .populate("submittedBy", "fullName email phoneNo")
        .populate("assignedTo", "fullName email phoneNo");

    if (!complaint) {
        throw new ApiError(404, "Complaint not found!");
    }

    if (req.user.role !== "admin" && complaint.submittedBy?._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to view this report!");
    }

    const messages = await Message.find({ complaintId }).populate("senderId", "fullName role").sort({ createdAt: 1 });

    const aiReport = await generateReportAI(complaint, messages);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=report_${complaintId}.pdf`);

    doc.pipe(res);

    doc.fillColor("#0f172a").fontSize(22).text("Municipality Complaint Report", { align: "center" });
    doc.moveDown(0.5);
    doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(1.5);

    doc.fontSize(14).fillColor("#1e3a8a").text("Complaint Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333333");
    
    doc.text(`ID: ${complaint._id}`);
    doc.text(`Title: ${complaint.title}`);
    doc.text(`Category: ${complaint.category}   |   Priority: ${complaint.priority}`);
    doc.text(`Status: ${complaint.status}`);
    doc.text(`Location: ${complaint.location?.address || "N/A"}`);
    doc.text(`Date Submitted: ${complaint.createdAt ? new Date(complaint.createdAt).toLocaleString("en-GB") : "N/A"}`);
    doc.text(`Date Resolved: ${complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString("en-GB") : "N/A"}`);
    
    doc.moveDown(1);
    doc.fontSize(14).fillColor("#1e3a8a").text("Stakeholders Involved", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333333");
    doc.text(`Citizen Name: ${complaint.submittedBy?.fullName || "N/A"}`);
    doc.text(`Citizen Email: ${complaint.submittedBy?.email || "N/A"}`);
    doc.text(`Assigned Staff: ${complaint.assignedTo?.fullName || "Not Assigned"}`);
    doc.text(`Staff Email: ${complaint.assignedTo?.email || "N/A"}`);

    doc.moveDown(1.5);
    
    doc.fontSize(14).fillColor("#1e3a8a").text("AI Resolution Report", { underline: true });
    doc.moveDown(0.8);
    doc.fontSize(11).fillColor("#000000");
    
    doc.text(aiReport, {
        align: "justify",
        lineGap: 4
    });

    doc.end();
});

export {registerComplaint,
    assignComplaintToStaff,
    getComplaints,
    updateComplaintStatus,
    editComplaint,
    deleteComplaint,
    generateResolutionOTP,
    generateComplaintReport
}
