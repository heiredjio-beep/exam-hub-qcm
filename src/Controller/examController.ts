import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import type { ExamInput } from '../Model/exam';
import {
  creerExamen,
  listerExamens,
  modifierExamen,
  obtenirExamenOuEchouer,
  supprimerExamen,
} from '../Service/examService';

function idDepuisParametre(valeur: string | string[]): number {
  const id = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest('Identifiant invalide.');
  }
  return id;
}

function inputDepuisCorps(corps: unknown): ExamInput {
  const c = corps as Partial<ExamInput> | null;
  if (!c || typeof c !== 'object') {
    throw HttpError.badRequest('Corps de requete invalide.');
  }
  return {
    courseId: Number(c.courseId),
    title: String(c.title ?? ''),
    description: c.description ?? null,
    startsAt: String(c.startsAt ?? ''),
    endsAt: String(c.endsAt ?? ''),
  };
}

export async function listerExamensHandler(_req: Request, res: Response): Promise<void> {
  const examens = await listerExamens();
  res.json(examens);
}

export async function obtenirExamenHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const examen = await obtenirExamenOuEchouer(id);
  res.json(examen);
}

export async function creerExamenHandler(req: Request, res: Response): Promise<void> {
  const input = inputDepuisCorps(req.body);
  const examen = await creerExamen(input);
  res.status(201).json(examen);
}

export async function modifierExamenHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const input = inputDepuisCorps(req.body);
  const examen = await modifierExamen(id, input);
  res.json(examen);
}

export async function supprimerExamenHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  await supprimerExamen(id);
  res.status(204).send();
}