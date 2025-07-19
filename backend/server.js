
// Import necessary modules
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from 'path';

// Authentication middleware
import authMiddleware from "./middleware/authMiddleware.js";

// Import route handlers
import authRoutes from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import uploadRouter from './routes/uploadRoute.js';
import signatureRouter from './routes/signatureRoute.js';
import pdfRouter from './routes/pdfGenerateRoute.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// --------------------
//  Allowed Origins
// --------------------
const allowedOrigins = [
  "http://localhost:3000", // local frontend
  "https://e-sign-pdf-project-frontend.vercel.app" // deployed frontend (Vercel)
];

// --------------------
//  CORS Middleware
// -------------------
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


// --------------------
//  Global Middlewares
// --------------------
app.use(cookieParser());
app.use(express.json()); // parse JSON request bodies



// --------------------
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // Serve uploaded PDFs

//  Routes
// --------------------
app.use("/api/auth", authRoutes); // public auth routes
app.use("/api/user", authMiddleware, userRoute); // protected user info
app.use('/api/docs',authMiddleware, uploadRouter);
app.use("/api/signatures", authMiddleware, signatureRouter);
app.use('/api/pdf', authMiddleware, pdfRouter);



//  Basic health check route
app.get("/", (req, res) => {
  res.send("E-Seal Trust Backend Server is running.");
});

// --------------------
//  Start the Server
// --------------------
const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
