
import {
  registerUser,
  authenticateUser,
} from "../service/authService.js";
import { generateToken } from "../utils/token.js";

/**
 * @desc    Controller to handle user signup logic
 * @route   POST /api/auth/signup
 * @access  Public
 */

export const signupController = async (req, res) => {
  try {
     // Destructure user details from request body
    const { username, email, password } = req.body;

     // Service handles validation, hashing, and insertion to DB
    const user = await registerUser(username, email, password);

      // Generate JWT token using user's ID
    const token = generateToken(user.id);

      // Set JWT token in HTTP-only cookie (secure storage on client)
    res.cookie("token", token, {
      httpOnly: true, // Prevents JS access (XSS protection)
      sameSite: "None",
       // Allows cookie for same-site requests (good CSRF balance)
       secure: true,
      maxAge: 10 * 60 * 1000, // 10 minutes validity in milliseconds
    });

     // Respond with user data (excluding password)
    res.status(201).json({
      message: "User created",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
      // Log error and return generic failure message to client
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

/**
 * Controller for user login
 */
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
       secure: true,
      maxAge: 10 * 60 * 1000, // Expiry after 10 minutes
    });

    res.status(200).json({
      message: "Logged in",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(401).json({ message: "Login failed", error: error.message });
  }
};

/**
 * Controller for user logout
 */
export const logoutController = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
};
