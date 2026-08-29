import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import * as attemptService from '../Service/attemptService';

/**
 * Couche Controller/ — perimetre P5.
 * Lit la requete, appelle le service, renvoie la reponse. Rien d'autre.
 */

/**
 * L'identite de l'etudiant vient du token verifie par authGuard.
 * On ne lit JAMAIS un identifiant d'etudiant dans l'URL ou le corps :
 * un client malveillant enverrait celui de quelqu'un d'autre.
 */
function etudiantConnecte(req: Request): number {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

function idDepuisParametre(valeur: string | string[] | undefined): number {
  const id = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest('Identifiant invalide.');
  }
  return id;
}

/** GET /api/my/exams */
export async function listerExamensDisponiblesHandler(req: Request, res: Response): Promise<void> {
  const examens = await attemptService.listerExamensDisponibles(etudiantConnecte(req));
  res.json(examens);
}

/** GET /api/my/exams/:id */
export async function chargerExamenHandler(req: Request, res: Response): Promise<void> {
  const examId = idDepuisParametre(req.params.id);
  const examen = await attemptService.chargerExamenPourPassage(examId, etudiantConnecte(req));
  res.json(examen);
}
