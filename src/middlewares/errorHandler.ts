import type { NextFunction, Request, Response } from 'express';
import { isHttpError } from '../Security/httpError';
import { isProduction } from '../config/env';

/** Codes d'erreur PostgreSQL rencontres dans ce projet. */
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_CHECK_VIOLATION = '23514';

function codePostgres(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/**
 * Middleware d'erreur unique de l'application (RG-13).
 * Il est monte en dernier dans app.ts et produit toujours la meme forme :
 *
 *     { "message": "Cet examen n'est pas ouvert." }
 *
 * La pile n'est jamais renvoyee au client, elle est journalisee cote serveur.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Express exige la signature a quatre parametres ; si la reponse est deja
  // partie, on laisse Express fermer la connexion lui-meme.
  if (res.headersSent) {
    next(error);
    return;
  }

  if (isHttpError(error)) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  // Filet de securite : une contrainte de base qui remonte jusqu'ici n'a pas
  // ete traduite par la couche Service/. On renvoie un code correct plutot
  // qu'un 500, mais le message reste generique : c'est au service concerne
  // de lever une HttpError avec un message comprehensible par l'utilisateur.
  switch (codePostgres(error)) {
    case PG_UNIQUE_VIOLATION:
      console.error('[errorHandler] contrainte unique non traduite', error);
      res.status(409).json({ message: 'Cette donnee existe deja.' });
      return;
    case PG_FOREIGN_KEY_VIOLATION:
      console.error('[errorHandler] contrainte de cle etrangere non traduite', error);
      res.status(409).json({ message: 'Cette donnee est utilisee ailleurs et ne peut pas etre modifiee.' });
      return;
    case PG_CHECK_VIOLATION:
      console.error('[errorHandler] contrainte CHECK non traduite', error);
      res.status(400).json({ message: 'Donnees invalides.' });
      return;
    default:
      break;
  }

  console.error('[errorHandler] erreur non geree', error);
  res.status(500).json({
    message: isProduction
      ? 'Une erreur interne est survenue.'
      : `Une erreur interne est survenue : ${error instanceof Error ? error.message : String(error)}`,
  });
}

/** Route inconnue : meme format d'erreur que tout le reste (RG-13). */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Ressource introuvable.' });
}
