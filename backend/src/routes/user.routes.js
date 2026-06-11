import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js" 
import { authorize } from "../middlewares/role.middleware.js"

import { getUserProfile,
    editProfile,
    logoutUser,
    getMyStats,
    createStaff,
    getAllStaff,
    getAllUsers
 } from "../controllers/user.controllers.js";

const router = Router()

router.use(verifyJWT)

router.get("/profile",getUserProfile)
router.patch("/edit-profile", editProfile)
router.post("/logout", logoutUser)
router.get("/stats", getMyStats)

router.post(
 "/create-staff",
 authorize("admin"),
 createStaff
);

router.get(
 "/staffs",
 authorize("admin"),
 getAllStaff
);

router.get(
 "/all",
 authorize("admin"),
 getAllUsers
);

export default router;