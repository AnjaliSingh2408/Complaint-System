import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.models.js";

export const getComplaintMessages = asyncHandler(async (req, res) => {
    const { complaintId } = req.params;

    if (!complaintId) {
        throw new ApiError(400, "Complaint ID is required!");
    }

    // Fetch all messages for this complaint, sorted by oldest to newest
    const messages = await Message.find({ complaintId }).sort({ createdAt: 1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { messages },
                "Messages fetched successfully"
            )
        );
});
