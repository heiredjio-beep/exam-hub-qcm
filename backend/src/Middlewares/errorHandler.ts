import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../Security/httpError';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur interne est survenue.' });
}