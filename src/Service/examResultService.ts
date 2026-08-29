import { HttpError } from '../Security/httpError';
import type { ExamResults } from '../Model/examResult';
import { examExists } from '../Repositorie/questionRepository';
import { findResultsByExam, getResultsSummary } from '../Repositorie/examResultRepository';

/**
 * Couche Service/ — perimetre P4 (resultats).
 * Reutilise examExists() du repository questions : un seul point de
 * verite pour "cet examen existe-t-il", pas de duplication de requete.
 */
export async function obtenirResultats(examId: number): Promise<ExamResults> {
  const existe = await examExists(examId);
  if (!existe) {
    throw HttpError.notFound('Examen introuvable.');
  }

  const [results, summary] = await Promise.all([
    findResultsByExam(examId),
    getResultsSummary(examId),
  ]);

  return { results, summary };
}
