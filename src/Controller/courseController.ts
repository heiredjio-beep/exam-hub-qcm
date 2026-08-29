import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import type { CourseInput } from '../Model/course';
import {
  creerCours,
  listerCours,
  modifierCours,
  obtenirCoursOuEchouer,
  supprimerCours,
} from '../Service/courseService';

function idDepuisParametre(valeur: string | string[]): number {
  const id = Number(Array.isArray(valeur) ? valeur[0] : valeur);
  if (!Number.isInteger(id) || id <= 0) {
    throw HttpError.badRequest('Identifiant invalide.');
  }
  return id;
}

function inputDepuisCorps(corps: unknown): CourseInput {
  const c = corps as Partial<CourseInput> | null;
  if (!c || typeof c !== 'object') {
    throw HttpError.badRequest('Corps de requete invalide.');
  }
  return {
    code: String(c.code ?? ''),
    name: String(c.name ?? ''),
    description: c.description ?? null,
  };
}

export async function listerCoursHandler(_req: Request, res: Response): Promise<void> {
  const cours = await listerCours();
  res.json(cours);
}

export async function obtenirCoursHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const cours = await obtenirCoursOuEchouer(id);
  res.json(cours);
}

export async function creerCoursHandler(req: Request, res: Response): Promise<void> {
  const input = inputDepuisCorps(req.body);
  const cours = await creerCours(input);
  res.status(201).json(cours);
}

export async function modifierCoursHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const input = inputDepuisCorps(req.body);
  const cours = await modifierCours(id, input);
  res.json(cours);
}

export async function supprimerCoursHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  await supprimerCours(id);
  res.status(204).send();
}