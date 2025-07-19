
import express from "express";
import {
  signupController,
  loginController,
  logoutController,
} from "../controllers/authController.js";

// Initialize express router instance
const authRoutes = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
authRoutes.post("/signup", signupController);

/**
 * @route   POST /api/auth/login
 * @desc    Log in an existing user
 */
authRoutes.post("/login", loginController);

/**
 * @route   POST /api/auth/logout
 * @desc    Log out user by clearing cookie
 */
authRoutes.post("/logout", logoutController);

// Export routes to be used in the main server
export default authRoutes;
