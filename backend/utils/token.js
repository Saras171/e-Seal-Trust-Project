import jwt from "jsonwebtoken";


/**
 * @function generateToken
 * @description Generates a JSON Web Token (JWT) for a given user ID.
 *              This token is used for user authentication and is stored
 *              in the browser as an HTTP-only cookie to ensure security.
 *
 * @param {string} userId - The unique identifier of the authenticated user.
 * @returns {string} - A signed JWT token valid for 10 minutes.
 *
 * Note:
 * - The token payload contains the userId.
 * - The secret used for signing is pulled from environment variables (JWT_SECRET).
 * - Expiration time is set to 10 minutes for secure session handling.
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, // Payload: user identity
     process.env.JWT_SECRET,   // Secret key for signing (should be strong and private)
     { expiresIn: "10m", }      // Token expires in 10 minutes
    );
};

export const generateSignatureLinkToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" }); // userId, docId
};
