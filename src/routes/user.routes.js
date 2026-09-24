import { Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

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

    (req, res, next) => {
        console.log("🔥 MULTER FINISHED")
        console.log("FILES:", req.files)
        next()
    },

    registerUser
)
export default router;