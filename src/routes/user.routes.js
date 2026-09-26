import { Router} from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(

    (req, res, next) => {
        console.log("🚨 REGISTER ROUTE HIT")
        next()
    },

    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),

    (req, _, next) => {     // this "_" in place of res is used because res is in no use. This
        //practice is used in production grade codes...
        console.log("🔥 MULTER FINISHED")
        console.log("FILES:", req.files)
        next()
    },

    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;