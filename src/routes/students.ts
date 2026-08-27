import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';
import {
  creerEtudiantHandler,
  desactiverEtudiantHandler,
  listerEtudiantsHandler,
  modifierEtudiantHandler,
  reinitialiserMotDePasseHandler,
} from '../Controller/studentController';

/**
 * CRUD /api/students (RG-10 : desactivation, jamais de suppression)
 *
 * Proprietaire : P2 - comptes etudiants
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts : c'est ce qui evite que cinq
 * personnes se marchent dessus sur le meme fichier (regle R8).
 */
export const studentsRouter = Router();

studentsRouter.use(authGuard, roleGuard('ADMIN'));

studentsRouter.get('/', asyncHandler(listerEtudiantsHandler));
studentsRouter.post('/', asyncHandler(creerEtudiantHandler));
studentsRouter.put('/:id', asyncHandler(modifierEtudiantHandler));
studentsRouter.post('/:id/reset-password', asyncHandler(reinitialiserMotDePasseHandler));
studentsRouter.delete('/:id', asyncHandler(desactiverEtudiantHandler));
