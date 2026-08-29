import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import { obtenirResultats } from '../Service/examResultService';

/** Couche Controller/ — perimetre P4 (resultats). */

function idDepuisParametre(valeur: string | string[]): number {
  const id = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest('Identifiant invalide.');
  }
  return id;
}

/** GET /api/exams/:id/results */
export async function obtenirResultatsHandler(req: Request, res: Response): Promise<void> {
  const examId = idDepuisParametre(req.params.id);
  const resultats = await obtenirResultats(examId);
  res.json(resultats);
}
