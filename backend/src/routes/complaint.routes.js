import { Router } from "express"
import { upload } from "../middlewares/multer.middlerware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

import {registerComplaint,
    assignComplaintToStaff,
    getComplaints,
    updateComplaintStatus,
    editComplaint,
    deleteComplaint
} from "../controllers/complaint.controllers.js"

const router = Router()

router.use(verifyJWT)

router.post(
  "/complaints",
  authorize("citizen"),
  upload.array("images", 5),
  registerComplaint
);

router.patch(
    "/complaints/:complaintId/assign",
    authorize("admin"),
    assignComplaintToStaff
);

router.get(
    "/complaints",
    getComplaints
);

router.patch(
    "/complaints/:complaintId/status",
    authorize("admin", "staff"),
    updateComplaintStatus
);

router.patch(
    "/complaints/:complaintId",
    authorize("citizen"),
    upload.array("images", 5),
    editComplaint
);

router.delete(
    "/complaints/:complaintId",
    authorize("citizen", "admin"),
    deleteComplaint
);



export default router;