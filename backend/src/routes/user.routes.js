import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

import { getUserProfile,
    editProfile,
    logoutUser,
    getMyStats
 } from "../controllers/user.controllers";

const router = Router()

router.use(verifyJWT)

router.get("/profile",getUserProfile)
router.patch("/edit-profile", editProfile)
router.post("/logout", logoutUser)
router.get("/stats", getMyStats)
