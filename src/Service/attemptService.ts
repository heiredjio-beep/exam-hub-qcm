import { HttpError } from '../Security/httpError';
import { withTransaction } from '../db/pool';
import * as attemptRepository from '../Repositorie/attemptRepository';
import * as answerRepository from '../Repositorie/answerRepository';
import { calculerNote } from './scoringService';
import type {
  AnswerInput,
  AttemptHistoryItem,
  AttemptResult,
  AvailableExam,
  StudentExam,
} from '../Model/attempt';

/** Violation de contrainte unique cote PostgreSQL. */
const PG_UNIQUE_VIOLATION = '23505';

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

/**
 * Soumission d'un examen — le coeur de la note.
 *
 * TOUT se passe dans une seule transaction :
 *   1. deuxieme controle de la fenetre (RG-03) — l'examen a pu fermer
 *      pendant que l'etudiant composait
 *   2. deuxieme controle de l'absence de tentative (RG-02)
 *   3. rechargement des bonnes reponses depuis la base (RG-06)
 *   4. calcul de la note (RG-05 pour les questions sans reponse)
 *   5. insertion de la tentative puis des reponses
 *
 * Sans transaction, deux soumissions simultanees pourraient creer deux
 * tentatives ou des reponses orphelines. La contrainte
 * UNIQUE(exam_id, student_id) est la garantie finale : si deux requetes
 * passent les controles en meme temps, PostgreSQL en rejette une et on
 * traduit l'erreur 23505 en 409 lisible.
 */
export async function soumettreExamen(
  examId: number,
  studentId: number,
  reponses: AnswerInput[]
): Promise<AttemptResult> {
  const fenetre = await attemptRepository.findExamWindow(examId);
  if (!fenetre) {
    throw HttpError.notFound('Examen introuvable.');
  }

  try {
    return await withTransaction(async (client) => {
      // RG-03, deuxieme point de controle, verrouille dans la transaction.
      const ouvert = await client.query(
        `SELECT (now() BETWEEN starts_at AND ends_at) AS ouvert FROM exams WHERE id = $1`,
        [examId]
      );
      if (!ouvert.rowCount || !ouvert.rows[0].ouvert) {
        throw HttpError.forbidden("Cet examen n'est plus ouvert.");
      }

      // RG-02, deuxieme point de controle.
      const dejaPasse = await client.query(
        `SELECT 1 FROM attempts WHERE exam_id = $1 AND student_id = $2`,
        [examId, studentId]
      );
      if (dejaPasse.rowCount) {
        throw HttpError.conflict('Vous avez deja passe cet examen.');
      }

      const questions = await answerRepository.findQuestionsAvecCorrection(client, examId);
      if (questions.length === 0) {
        throw HttpError.conflict("Cet examen ne contient aucune question.");
      }

      const calcul = calculerNote(questions, reponses);

      const tentative = await attemptRepository.insertAttempt(
        client,
        examId,
        studentId,
        calcul.score,
        calcul.maxScore
      );
      await answerRepository.insertAnswers(client, tentative.id, calcul.reponsesAEnregistrer);

      return {
        attemptId: tentative.id,
        examId,
        examTitle: fenetre.title,
        score: calcul.score,
        maxScore: calcul.maxScore,
        pourcentage:
          calcul.maxScore > 0 ? Math.round((calcul.score / calcul.maxScore) * 100) : 0,
        submittedAt: tentative.submittedAt,
        corrections: calcul.corrections,
      };
    });
  } catch (erreur) {
    // Deux soumissions simultanees : la base en a rejete une (RG-02).
    if (
      typeof erreur === 'object' &&
      erreur !== null &&
      'code' in erreur &&
      (erreur as { code: unknown }).code === PG_UNIQUE_VIOLATION
    ) {
      throw HttpError.conflict('Vous avez deja passe cet examen.');
    }
    throw erreur;
  }
}

/** Historique personnel de l'etudiant connecte, du plus recent au plus ancien. */
export async function listerMesResultats(studentId: number): Promise<AttemptHistoryItem[]> {
  return attemptRepository.findHistory(studentId);
}
