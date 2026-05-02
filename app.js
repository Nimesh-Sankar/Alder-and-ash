import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // For serving HTML/CSS/JS

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);

app.use(express.static(path.join(__dirname, 'public')));

// HTML routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/user/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'user', 'home.html'));
});
// Serve HTML pages
app.get("/", (req, res) => {
  res.sendFile("views/user/home.html", { root: "." });
});

app.get("/admin", (req, res) => {
  res.sendFile("views/admin/dashboard.html", { root: "." });
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
  });