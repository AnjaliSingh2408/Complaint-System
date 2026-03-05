import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { Complaint } from "../models/complaint.models.js";

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
    const { title, description, location} = req.body;

    

})