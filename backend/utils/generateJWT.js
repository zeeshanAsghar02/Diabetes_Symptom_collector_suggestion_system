import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is missing or empty');
  }
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    throw new Error('REFRESH_TOKEN_SECRET or JWT_SECRET environment variable is missing or empty');
  }
  return secret;
};

// Generate access token (short-lived - 1 hour)
export const generateAccessToken = (userId, email) => {
  const secret = getJwtSecret();
  return jwt.sign({ userId, email }, secret, { expiresIn: "1h" });
};

// Generate refresh token (long-lived - 7 days)
export const generateRefreshToken = (userId, email) => {
  const secret = getRefreshSecret();
  return jwt.sign({ userId, email }, secret, { expiresIn: "7d" });
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    const secret = getRefreshSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};