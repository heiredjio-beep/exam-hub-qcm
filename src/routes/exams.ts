import { Router } from 'express';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  creerExamenHandler,
  listerExamensHandler,
  modifierExamenHandler,
  obtenirExamenHandler,
  supprimerExamenHandler,
} from '../Controller/examController';

export const examsRouter = Router();

examsRouter.use(authGuard, roleGuard('ADMIN'));

examsRouter.get('/', asyncHandler(listerExamensHandler));
examsRouter.get('/:id', asyncHandler(obtenirExamenHandler));
examsRouter.post('/', asyncHandler(creerExamenHandler));
examsRouter.put('/:id', asyncHandler(modifierExamenHandler));
examsRouter.delete('/:id', asyncHandler(supprimerExamenHandler));