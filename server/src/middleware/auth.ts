import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// This makes userId and userEmail available on the standard Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export const authenticate = (
  req: Request,
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
    const payload = verifyToken(token) as { userId: string; email: string };

    req.userId = payload.userId;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};