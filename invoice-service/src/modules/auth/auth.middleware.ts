import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: { message: 'Missing token' }});
  const token = h.slice(7);
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as any;
    (req as any).userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid token' }});
  }
}
