import jwt from "jsonwebtoken";

export const generateAuthToken = (userId: string): string => {
  const token = jwt.sign(
    { userId }, 
    process.env.JWT_SECRET!, 
    { expiresIn: "10h" } // or your preferred expiry
  );
  return token;
};
