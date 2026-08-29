import type { Request, Response } from 'express';
import { HttpError } from '../Security/httpError';
import {
  creerEtudiant,
  desactiverEtudiant,
  listerEtudiants,
  modifierEtudiant,
  reinitialiserMotDePasse,
} from '../Service/studentService';

/**
 * Couche Controller/ — perimetre P2 (comptes etudiants).
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

/** GET /api/students */
export async function listerEtudiantsHandler(_req: Request, res: Response): Promise<void> {
  const etudiants = await listerEtudiants();
  res.json(etudiants);
}

/** POST /api/students */
export async function creerEtudiantHandler(req: Request, res: Response): Promise<void> {
  const { fullName, email, password } = req.body ?? {};
  const etudiant = await creerEtudiant(
    String(fullName ?? ''),
    String(email ?? ''),
    String(password ?? '')
  );
  res.status(201).json(etudiant);
}

/** PUT /api/students/:id */
export async function modifierEtudiantHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const { fullName, email } = req.body ?? {};
  const etudiant = await modifierEtudiant(id, String(fullName ?? ''), String(email ?? ''));
  res.json(etudiant);
}

/** POST /api/students/:id/reset-password */
export async function reinitialiserMotDePasseHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const { password } = req.body ?? {};
  await reinitialiserMotDePasse(id, String(password ?? ''));
  res.status(204).send();
}

/** DELETE /api/students/:id — RG-10 : desactivation, jamais de suppression physique. */
export async function desactiverEtudiantHandler(req: Request, res: Response): Promise<void> {
  const id = idDepuisParametre(req.params.id);
  const etudiant = await desactiverEtudiant(id);
  res.json(etudiant);
}
