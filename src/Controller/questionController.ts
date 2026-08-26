import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import type { QuestionInput } from '../Model/question';
import {
  creerQuestion,
  listerQuestions,
  modifierQuestion,
  supprimerQuestion,
} from '../Service/questionService';

/**
 * Couche Controller/ — perimetre P4.
 * Ne fait que : lire req, appeler le Service, ecrire res. Aucune requete
 * SQL et aucune regle de gestion ici (tout est dans Service/).
 */

function idDepuisParametre(valeur: string | string[]): number {
  const id = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest('Identifiant invalide.');
  }
  return id;
}

function inputDepuisCorps(corps: unknown): QuestionInput {
  const c = corps as Partial<QuestionInput> | null;
  if (!c || typeof c !== 'object') {
    throw HttpError.badRequest('Corps de requete invalide.');
  }
  return {
    statement: String(c.statement ?? ''),
    points: Number(c.points),
    position: c.position === undefined ? undefined : Number(c.position),
    choices: Array.isArray(c.choices)
      ? c.choices.map((choix) => ({
          label: String(choix.label ?? ''),
          isCorrect: Boolean(choix.isCorrect),
        }))
      : [],
  };
}

/** GET /api/exams/:id/questions */
export async function listerQuestionsHandler(req: Request, res: Response): Promise<void> {
  const examId = idDepuisParametre(req.params.id);
  const questions = await listerQuestions(examId);
  res.json(questions);
}

/** POST /api/exams/:id/questions */
export async function creerQuestionHandler(req: Request, res: Response): Promise<void> {
  const examId = idDepuisParametre(req.params.id);
  const input = inputDepuisCorps(req.body);
  const question = await creerQuestion(examId, input);
  res.status(201).json(question);
}

/** PUT /api/questions/:id */
export async function modifierQuestionHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const input = inputDepuisCorps(req.body);
  const question = await modifierQuestion(id, input);
  res.json(question);
}

/** DELETE /api/questions/:id */
export async function supprimerQuestionHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  await supprimerQuestion(id);
  res.status(204).send();
}
