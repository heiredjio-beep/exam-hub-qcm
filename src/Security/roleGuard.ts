import { Request, Response, NextFunction } from 'express';
import { HttpError } from './httpError';

export function roleGuard(...allowedRoles: Array<'ADMIN' | 'STUDENT'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new HttpError(403, 'Acces refuse');
    }
    next();
  };
}