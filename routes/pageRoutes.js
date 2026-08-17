import express from "express";
import { requireUser } from "../middlewares/authMiddleware.js";
import { getHome } from "../controllers/userController.js";


const router = express.Router();

router.get("/", getHome);

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});

router.get("/passwordotp", (req, res) => {
  res.render("passwordotp");
});

router.get("/reset-password", (req, res) => {
  res.render("reset-password");
});

router.get("/otp", (req, res) => {
  res.render("otp");
});

router.get(
  "/user/emailotp",
  requireUser,
  (req, res) => {
    res.render("user/emailotp");
  }
);


export default router;