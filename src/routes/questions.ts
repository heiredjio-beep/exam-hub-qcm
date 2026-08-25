import { Router } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  modifierQuestionHandler,
  supprimerQuestionHandler,
} from '../Controller/questionController';

/**
 * PUT|DELETE /api/questions/:id (RG-04 et RG-08)
 *
 * Proprietaire : P4 - questions
 * Ce fichier est deja monte dans src/app.ts. Remplissez-le sur votre
 * branche, sans jamais modifier app.ts : c'est ce qui evite que cinq
 * personnes se marchent dessus sur le meme fichier (regle R8).
 */
export const questionsRouter = Router();

// TODO(P2) : brancher le guard d'authentification + role ADMIN des que
// Security/ expose ses middlewares (feat/auth-guards). En attendant,
// ces routes restent ouvertes pour permettre les tests au curl.
questionsRouter.put('/:id', asyncHandler(modifierQuestionHandler));
questionsRouter.delete('/:id', asyncHandler(supprimerQuestionHandler));
