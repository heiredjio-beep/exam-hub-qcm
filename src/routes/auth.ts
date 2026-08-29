import { Router } from 'express';
import { login } from '../Controller/authController';

/**
 * POST /api/auth/login
 *
 * Proprietaire : P2 - authentification
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts
 */
export const authRouter = Router();

authRouter.post('/login', login);