import { HttpError } from '../Security/httpError';
import * as attemptRepository from '../Repositorie/attemptRepository';
import type { AvailableExam, StudentExam } from '../Model/attempt';

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

/**
 * RG-03, premier point de controle : l'examen doit exister et sa fenetre
 * doit etre ouverte maintenant. Le second point de controle est refait
 * dans la transaction de soumission — l'examen peut fermer pendant que
 * l'etudiant compose.
 */
export async function chargerExamenPourPassage(
  examId: number,
  studentId: number
): Promise<StudentExam> {
  const fenetre = await attemptRepository.findExamWindow(examId);
  if (!fenetre) {
    throw HttpError.notFound('Examen introuvable.');
  }
  if (!fenetre.ouvert) {
    throw HttpError.forbidden("Cet examen n'est pas ouvert.");
  }

  await assertAucuneTentative(examId, studentId);

  const examen = await attemptRepository.findStudentExam(examId);
  if (!examen) {
    throw HttpError.notFound('Examen introuvable.');
  }
  if (examen.questions.length === 0) {
    throw HttpError.conflict("Cet examen ne contient aucune question pour le moment.");
  }
  return examen;
}
