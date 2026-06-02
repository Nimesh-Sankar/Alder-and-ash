import express from "express";
import passport from "passport";
import { signup, login, getUsers } from "../controllers/authController.js";

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


router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });
});


router.post("/signup", signup);
router.post("/login", login);
router.get("/users", getUsers);

export default router;