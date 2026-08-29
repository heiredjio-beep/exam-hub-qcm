import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import * as attemptService from '../Service/attemptService';
import type { AnswerInput } from '../Model/attempt';

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

/**
 * Lit le tableau de reponses du corps de la requete.
 *
 * RG-06 : on ne lit QUE questionId et choiceId. Si le client envoie un
 * score ou un booleen de justesse, ces champs sont ignores purement et
 * simplement — le serveur ne fait jamais confiance a une note recue.
 */
function reponsesDepuisCorps(corps: unknown): AnswerInput[] {
  const c = corps as { answers?: unknown } | null;
  if (!c || typeof c !== 'object' || !Array.isArray(c.answers)) {
    throw HttpError.badRequest('Le corps doit contenir un tableau "answers".');
  }

  return c.answers.map((brut) => {
    const reponse = brut as { questionId?: unknown; choiceId?: unknown };
    const questionId = Number(reponse.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      throw HttpError.badRequest('Chaque reponse doit porter un questionId valide.');
    }

    const choixBrut = reponse.choiceId;
    if (choixBrut === null || choixBrut === undefined) {
      return { questionId, choiceId: null };
    }

    const choiceId = Number(choixBrut);
    if (!Number.isInteger(choiceId) || choiceId <= 0) {
      throw HttpError.badRequest('choiceId doit etre un identifiant valide ou null.');
    }
    return { questionId, choiceId };
  });
}

/** POST /api/my/exams/:id/submit */
export async function soumettreExamenHandler(req: Request, res: Response): Promise<void> {
  const examId = idDepuisParametre(req.params.id);
  const reponses = reponsesDepuisCorps(req.body);
  const resultat = await attemptService.soumettreExamen(
    examId,
    etudiantConnecte(req),
    reponses
  );
  res.status(201).json(resultat);
}

/** GET /api/my/results */
export async function listerMesResultatsHandler(req: Request, res: Response): Promise<void> {
  const historique = await attemptService.listerMesResultats(etudiantConnecte(req));
  res.json(historique);
}
