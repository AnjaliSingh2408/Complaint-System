import { Router } from "express"
import { upload } from "../middlewares/multer.middlerware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

import {registerComplaint,
    assignComplaintToStaff
} from "../controllers/complaint.controllers.js"

const router = Router()

router.use(verifyJWT)

router.post(
  "/complaints",
  verifyJWT,
  authorize("citizen"),
  upload.array("images", 5),
  registerComplaint
);

router.patch(
    "/complaints/:complaintId/assign",
    verifyJWT,
    authorize("admin"),
    assignComplaintToStaff
)