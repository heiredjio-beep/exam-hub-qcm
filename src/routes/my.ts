import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';
import {
  chargerExamenHandler,
  listerExamensDisponiblesHandler,
  soumettreExamenHandler,
} from '../Controller/myExamController';

/**
 * /api/my/exams, /api/my/exams/:id, /api/my/exams/:id/submit, /api/my/results
 *
 * Proprietaire : P5 - espace etudiant et notation
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts : c'est ce qui evite que cinq
 * personnes se marchent dessus sur le meme fichier (regle R8).
 */
export const myRouter = Router();

// Tout l'espace etudiant est reserve au role STUDENT. Un administrateur qui
// appelle ces routes recoit 403 : il n'a rien a y faire, et cela evite
// qu'un compte admin cree une tentative par erreur.
myRouter.use(authGuard, roleGuard('STUDENT'));

myRouter.get('/exams', asyncHandler(listerExamensDisponiblesHandler));
myRouter.get('/exams/:id', asyncHandler(chargerExamenHandler));
myRouter.post('/exams/:id/submit', asyncHandler(soumettreExamenHandler));
