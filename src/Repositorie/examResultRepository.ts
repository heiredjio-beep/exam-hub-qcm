import { pool } from '../db/pool';
import type { ExamResultRow, ExamResultsSummary } from '../Model/examResult';

/**
 * Couche Repositorie/ — perimetre P4 (resultats).
 * RG-10 : le JOIN se fait sur tous les etudiants ayant une tentative,
 * actifs ou non (is_active n'est jamais filtre ici) : un etudiant
 * desactive garde ses resultats consultables.
 */

/** Liste des tentatives d'un examen, triees par note decroissante. */
export async function findResultsByExam(examId: number): Promise<ExamResultRow[]> {
  const resultat = await pool.query(
    `SELECT a.id AS attempt_id,
            a.student_id,
            u.full_name,
            u.email,
            u.is_active,
            a.score,
            a.max_score,
            a.submitted_at
       FROM attempts a
       JOIN users u ON u.id = a.student_id
      WHERE a.exam_id = $1
      ORDER BY a.score DESC, a.submitted_at ASC`,
    [examId]
  );

  return resultat.rows.map((ligne) => ({
    attemptId: ligne.attempt_id,
    studentId: ligne.student_id,
    fullName: ligne.full_name,
    email: ligne.email,
    isActive: ligne.is_active,
    score: ligne.score,
    maxScore: ligne.max_score,
    submittedAt: ligne.submitted_at,
  }));
}

/**
 * Moyenne et nombre de tentatives, calcules en SQL (AVG, COUNT).
 * COALESCE evite un NULL quand l'examen n'a encore aucune tentative.
 */
export async function getResultsSummary(examId: number): Promise<ExamResultsSummary> {
  const resultat = await pool.query(
    `SELECT COALESCE(AVG(a.score), 0)::float AS moyenne,
            COUNT(a.id)::int AS nombre_tentatives
       FROM attempts a
      WHERE a.exam_id = $1`,
    [examId]
  );

  return {
    average: resultat.rows[0].moyenne,
    attemptsCount: resultat.rows[0].nombre_tentatives,
  };
}
