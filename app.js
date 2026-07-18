import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userPageRoutes from "./routes/userPageRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";


const passportModule = await import("./config/passport.js");
const passport = passportModule.default;

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("view engine", "ejs");
app.set("views",path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();

});

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/user", userPageRoutes);
app.use("/", pageRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/cart", cartRoutes); 
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);  

app.use((req, res) => {
  res.status(404).send("Page not found");
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
      console.log(`Admin login: http://localhost:${process.env.PORT}/admin/login`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });