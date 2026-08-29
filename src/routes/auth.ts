import { Router } from 'express';
import { login } from '../Controller/authController';
import { asyncHandler } from '../middlewares/asyncHandler';

/**
 * POST /api/auth/login
 *
 * Proprietaire : P2 - authentification
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts
 */
export const authRouter = Router();

authRouter.post('/login', asyncHandler(login));

// RG-01 : il n'existe volontairement AUCUNE route d'inscription.
// Le premier administrateur est cree par le script de seed, et les comptes
// etudiants sont crees uniquement par un administrateur via /api/students.
// Ne pas ajouter de POST /api/auth/register : ce n'est pas un oubli.