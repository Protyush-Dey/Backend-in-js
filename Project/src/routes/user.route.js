import { Router } from "express";
import { loginUser, logoutUser, register, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlware.js"
import { verifyJWT } from "../middlewares/auth.middlare.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
        name:"avatar",
        maxCount:1
        },
        {
        name:"coverImage",
        maxCount:1
        },
    ]),
    register
);
router.route("/login").post(loginUser);
// secured route

router.route("/logout").post(verifyJWT , logoutUser);
router.route("/refresh-token").post(refreshAccessToken);


export default router;