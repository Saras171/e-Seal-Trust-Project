// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabaseConfig.js";


/**
 * @desc    Middleware to authenticate requests via JWT
 * @usage   Attaches authenticated user info to `req.user` if valid
 * @access  Private routes only
 */
const authMiddleware = async (req, res, next) => {
  try {
     // Extract token from cookies
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token provided" });

    
    // Verify JWT using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

      // Fetch user details from Supabase using decoded user ID
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("id", userId)
      .single();

        // If user not found or query failed
    if (!user || error) {
      return res.status(401).json({ message: "User not found" });
    }

       // Attach user info to request object for use in controllers
    req.user = user; 

    
    // Proceed to the next middleware/handler
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
  }
};

export default authMiddleware;
