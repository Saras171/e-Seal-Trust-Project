// Import password hashing utility and Supabase client
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabaseConfig.js";

  /**
 * @desc    Register a new user
 * @param   {string} username - Chosen display name of the user
 * @param   {string} email - User's email address
 * @param   {string} password - Raw password to hash
 * @returns {object} newUser - Created user object (id, username, email)
 * @throws  {Error} if user already exists or creation fails
 */
export const registerUser = async (username, email, password) => {
  if (!username || !email || !password) {
    throw new Error("All fields are required");
  }

    // Normalize inputs
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

    // Check if email is already in use
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", cleanEmail)
    .single();

    //  - Checks if user already exists
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

 // Securely hash the password using bcrypt
  const hashed = await bcrypt.hash(password, 10);

   // Insert new user into the database
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({ username: cleanUsername, email: cleanEmail, password: hashed })
    .select("id, username, email")
    .single();

  if (error) throw new Error("Failed to create user");

  return newUser;
};


/**
 * @desc    Authenticate an existing user by verifying credentials
 * @param   {string} email - User's email
 * @param   {string} password - Raw password input
 * @returns {object} user - Full user record if credentials are valid
 * @throws  {Error} if user not found or password invalid
 */
export const authenticateUser = async (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

    // Normalize email
  const cleanEmail = email.trim().toLowerCase();

  
  // Look up user by email
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", cleanEmail)
    .single();

    // Validate existence of user and data fetch success
  if (!user || error) {
    throw new Error("Invalid email or user not found");
  }

  // Compare submitted password with stored hash
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password");
  }

  return user;
};
