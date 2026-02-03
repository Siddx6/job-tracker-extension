import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extending the Express Request interface
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    // Cast the payload so TS knows what's inside
    const payload = verifyToken(token) as { userId: string; email: string };

    req.userId = payload.userId;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};