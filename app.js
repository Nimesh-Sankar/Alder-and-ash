import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

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
    secret: "googleauthsecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());


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
app.use("/api/otp", otpRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/cart", cartRoutes); 


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/forgot-password", (req, res) => {
  res.render("forgot-password");
});


app.get("/passwordotp", (req, res) => {
  res.render("passwordotp");
});

app.get("/reset-password", (req, res) => {
  res.render("reset-password");
});

app.get("/admin/login", (req, res) => {
  res.render("admin/login");
});
app.get("/user/index", (req, res) => {
  res.render("user/index");
});


app.get("/user/profile", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.render("user/profile");
});

app.get("/user/addresses", (req, res) => {
  res.render("user/addresses");
});

app.get("/user/edit-profile", (req, res) => {
  res.render("user/edit-profile");
});

app.get("/user/change-password", (req, res) => {
  res.render("user/change-password");
});

app.get("/admin", (req, res) => {
  res.render("admin/dashboard");
});

app.get("/otp", (req, res) => {
  res.render("otp");
});
app.get("/user/emailotp", (req, res) => {
  res.render("emailotp");
});
app.get("/admin/category", (req, res) => {
  res.render("admin/category");
});

app.get("/admin/add-category", (req, res) => {
  res.render("admin/add-category");
});


app.get("/admin/edit-category", (req, res) => {
  res.render("admin/edit-category");
});
app.get("/admin/brands-page", (req, res) => {
  res.render("admin/brands");
});

app.get("/admin/add-brand", (req, res) => {
  res.render("admin/add-brand");
});
app.get("/admin/edit-brand", (req, res) => {
  res.render("admin/edit-brand");
});
app.get("/admin/products-page", (req, res) => {

  res.render("admin/products");

});
app.get("/admin/add-product", (req, res) => {

  res.render("admin/add-product");

});
app.get("/admin/edit-product", (req, res) => {

  res.render("admin/edit-product");

});
app.get("/user/product-details", (req, res) => {

  res.render("user/product-details");

});
app.get("/user/cart", (req, res) => {
  res.render("user/cart");
});


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