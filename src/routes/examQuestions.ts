import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  creerQuestionHandler,
  listerQuestionsHandler,
} from '../Controller/questionController';
import { obtenirResultatsHandler } from '../Controller/resultController';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';

/**
 * GET|POST /api/exams/:id/questions et GET /api/exams/:id/results
 *
 * Proprietaire : P4 - questions et resultats par examen
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts : c'est ce qui evite que cinq
 * personnes se marchent dessus sur le meme fichier (regle R8).
 */
export const examQuestionsRouter = Router();

// RG-07 : ces routes exposent is_correct, elles sont donc reservees a
// l'administrateur. Sans ces gardes, n'importe qui lit les bonnes reponses.
examQuestionsRouter.use(authGuard, roleGuard('ADMIN'));

examQuestionsRouter.get('/:id/questions', asyncHandler(listerQuestionsHandler));
examQuestionsRouter.post('/:id/questions', asyncHandler(creerQuestionHandler));
examQuestionsRouter.get('/:id/results', asyncHandler(obtenirResultatsHandler));
