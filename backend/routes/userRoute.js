// Import express framework
import express from "express";

// Initialize express router instance
const userRouter = express.Router();

/**
 *  GET /api/user/me
 * This route is protected by authMiddleware
 */
userRouter.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ user: req.user });
});

// Export routes to be used in the main server
export default userRouter;
