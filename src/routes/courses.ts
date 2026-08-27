import { Router } from 'express';
import { authGuard } from '../Security/authGuard';
import { roleGuard } from '../Security/roleGuard';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  creerCoursHandler,
  listerCoursHandler,
  modifierCoursHandler,
  obtenirCoursHandler,
  supprimerCoursHandler,
} from '../Controller/courseController';

export const coursesRouter = Router();

coursesRouter.use(authGuard, roleGuard('ADMIN'));

coursesRouter.get('/', asyncHandler(listerCoursHandler));
coursesRouter.get('/:id', asyncHandler(obtenirCoursHandler));
coursesRouter.post('/', asyncHandler(creerCoursHandler));
coursesRouter.put('/:id', asyncHandler(modifierCoursHandler));
coursesRouter.delete('/:id', asyncHandler(supprimerCoursHandler));