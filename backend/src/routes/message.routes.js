import { Router } from "express";
import { getComplaintMessages } from "../controllers/message.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:complaintId").get(verifyJWT, getComplaintMessages);

export default router;
