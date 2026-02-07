import { Router } from "express"

import { upload } from "../middlewares/multer.middlerwares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 
import { registerCitizen,
    loginUser
 } from "../controllers/auth.controllers.js"

const router = Router()

router.route("/register").post(registerCitizen)
router.route("/login").post(loginUser)
