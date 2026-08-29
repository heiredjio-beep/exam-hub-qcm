import { HttpError } from '../Security/httpError';
import * as password from '../Security/password';
import * as userRepository from '../Repositorie/userRepository';
import type { StudentSummary } from '../Model/user';

/**
 * Couche Service/ — perimetre P2 (comptes etudiants).
 * RG-10 : desactivation uniquement, jamais de suppression physique.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validerNom(fullName: string): void {
  if (fullName.trim().length === 0) {
    throw HttpError.badRequest('Le nom complet ne peut pas etre vide.');
  }
}

function validerEmail(email: string): void {
  if (!EMAIL_REGEX.test(email)) {
    throw HttpError.badRequest('Email invalide.');
  }
}

function validerMotDePasse(plainPassword: string): void {
  if (plainPassword.length < 8) {
    throw HttpError.badRequest('Le mot de passe doit contenir au moins 8 caracteres.');
  }
}

async function trouverEtudiantOuEchouer(id: number) {
  const utilisateur = await userRepository.findById(id);
  if (!utilisateur || utilisateur.role !== 'STUDENT') {
    throw HttpError.notFound('Etudiant introuvable.');
  }
  return utilisateur;
}

export async function listerEtudiants(): Promise<StudentSummary[]> {
  return userRepository.findAllStudents();
}

export async function creerEtudiant(
  fullName: string,
  email: string,
  plainPassword: string
): Promise<StudentSummary> {
  validerNom(fullName);
  validerEmail(email);
  validerMotDePasse(plainPassword);

  const dejaPris = await userRepository.existsByEmail(email);
  if (dejaPris) {
    throw HttpError.conflict('Cet email est deja utilise.');
  }

  const passwordHash = await password.hash(plainPassword);
  return userRepository.createStudent(fullName, email, passwordHash);
}

export async function modifierEtudiant(
  id: number,
  fullName: string,
  email: string
): Promise<StudentSummary> {
  await trouverEtudiantOuEchouer(id);
  validerNom(fullName);
  validerEmail(email);

  const dejaPris = await userRepository.existsByEmail(email, id);
  if (dejaPris) {
    throw HttpError.conflict('Cet email est deja utilise.');
  }

  const etudiant = await userRepository.updateStudent(id, fullName, email);
  if (!etudiant) {
    throw HttpError.notFound('Etudiant introuvable.');
  }
  return etudiant;
}

export async function reinitialiserMotDePasse(id: number, plainPassword: string): Promise<void> {
  await trouverEtudiantOuEchouer(id);
  validerMotDePasse(plainPassword);
  const passwordHash = await password.hash(plainPassword);
  await userRepository.updatePasswordHash(id, passwordHash);
}

/** RG-10 : la ligne et l'historique des tentatives restent intacts. */
export async function desactiverEtudiant(id: number): Promise<StudentSummary> {
  await trouverEtudiantOuEchouer(id);
  const etudiant = await userRepository.setActive(id, false);
  if (!etudiant) {
    throw HttpError.notFound('Etudiant introuvable.');
  }
  return etudiant;
}
