import { Router } from "express"
import { upload } from "../middlewares/multer.middlerware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

import {} from "../controllers/complaint.controllers.js"

const router = Router()

router.use(verifyJWT)