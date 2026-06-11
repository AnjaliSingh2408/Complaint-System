import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import { authorize } from "../middlewares/role.middleware.js";
import {registerComplaint,
    assignComplaintToStaff,
    getComplaints,
    updateComplaintStatus,
    editComplaint,
    deleteComplaint,
    generateResolutionOTP,
    generateComplaintReport
} from "../controllers/complaint.controllers.js"

const router = Router()

router.use(verifyJWT)

router.post(
  "/",
  authorize("citizen"),
  upload.array("images", 5),
  registerComplaint
);

router.patch(
    "/:complaintId/assign",
    authorize("admin"),
    assignComplaintToStaff
);

router.get(
    "/",
    getComplaints
);

router.patch(
    "/:complaintId/status",
    authorize("admin", "staff"),
    updateComplaintStatus
);

router.patch(
    "/:complaintId",
    authorize("citizen"),
    upload.array("images", 5),
    editComplaint
);

router.delete(
    "/:complaintId",
    authorize("citizen", "admin"),
    deleteComplaint
);

router.post(
    "/:complaintId/generate-otp",
    authorize("staff", "admin"),
    generateResolutionOTP
);

router.post(
    "/:complaintId/report",
    authorize("admin", "citizen"),
    generateComplaintReport
);

export default router;
