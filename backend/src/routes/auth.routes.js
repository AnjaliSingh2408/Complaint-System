import { Router } from "express"

import { upload } from "../middlewares/multer.middlerware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 
import { registerCitizen,
    loginUser,
    refreshAccessToken,
    logoutUser
 } from "../controllers/auth.controllers.js"

const router = Router()

router.route("/register").post(registerCitizen)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
