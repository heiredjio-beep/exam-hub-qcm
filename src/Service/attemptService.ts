import { HttpError } from '../Security/httpError';
import * as attemptRepository from '../Repositorie/attemptRepository';
import type { AvailableExam } from '../Model/attempt';

/**
 * Couche Service/ — perimetre P5.
 * Porte RG-02 (une seule tentative), RG-03 (fenetre de disponibilite)
 * et RG-07 (aucune bonne reponse envoyee avant soumission).
 *
 * L'identifiant de l'etudiant vient TOUJOURS du token, jamais du client.
 */

export async function listerExamensDisponibles(studentId: number): Promise<AvailableExam[]> {
  return attemptRepository.findAvailableExams(studentId);
}

/**
 * RG-02, premier point de controle : refus si une tentative existe deja.
 * Le second point est la contrainte UNIQUE, verifiee dans la transaction
 * de soumission — l'un protege l'affichage, l'autre protege la donnee.
 */
export async function assertAucuneTentative(examId: number, studentId: number): Promise<void> {
  const tentative = await attemptRepository.findAttempt(examId, studentId);
  if (tentative) {
    throw HttpError.conflict('Vous avez deja passe cet examen.');
  }
}
