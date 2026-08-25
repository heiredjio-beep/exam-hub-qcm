import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Enveloppe un controleur asynchrone pour que toute promesse rejetee
 * parte vers errorHandler au lieu de rester silencieuse.
 *
 *   router.get('/', asyncHandler(courseController.list));
 *
 * Express 5 fait deja suivre les rejets automatiquement, mais l'enveloppe
 * est conservee : elle rend l'intention explicite, elle protege le projet
 * d'une retrogradation en Express 4, et elle evite qu'un oubli de try/catch
 * dans un controleur passe inapercu.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
