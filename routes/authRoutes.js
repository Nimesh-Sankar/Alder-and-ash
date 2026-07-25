import express from "express";
import passport from "passport";
import { signup, login, getUsers } from "../controllers/authController.js";
import {
    requireUser,
    requireAdmin
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    (req, res) => {

        const userData = encodeURIComponent(
            JSON.stringify(req.user)
        );

        res.redirect(`/user/profile?googleUser=${userData}`);
    }
);

router.get(
    "/logout",
    requireUser,
    (req, res) => {
        req.logout(() => {
            req.session.destroy(() => {
                res.redirect("/login");
            });
        });
    }
);

router.post("/signup", signup);

router.post("/login", login);

router.get(
    "/users",
    requireAdmin,
    getUsers
);

export default router;