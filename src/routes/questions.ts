import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  modifierQuestionHandler,
  supprimerQuestionHandler,
} from '../Controller/questionController';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';

/**
 * PUT|DELETE /api/questions/:id (RG-04 et RG-08)
 *
 * Proprietaire : P4 - questions
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts : c'est ce qui evite que cinq
 * personnes se marchent dessus sur le meme fichier (regle R8).
 */
export const questionsRouter = Router();

// Modification et suppression de questions : administrateur uniquement.
questionsRouter.use(authGuard, roleGuard('ADMIN'));

questionsRouter.put('/:id', asyncHandler(modifierQuestionHandler));
questionsRouter.delete('/:id', asyncHandler(supprimerQuestionHandler));
