import { Request, Response, NextFunction } from 'express';
import * as jwt from './jwt';
import * as userRepository from '../Repositorie/userRepository';
import { HttpError } from './httpError';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: 'ADMIN' | 'STUDENT' };
    }
  }
}


export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentification requise');
    }

    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token);

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new HttpError(401, 'Authentification requise');
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, 'Token invalide ou expire'));
  }
}