import { pool } from '../db/pool';
import type { ExamInput, ExamListItem } from '../Model/exam';

function ligneVersExamListItem(ligne: any): ExamListItem {
  return {
    id: ligne.id,
    title: ligne.title,
    description: ligne.description,
    startsAt: new Date(ligne.starts_at).toISOString(),
    endsAt: new Date(ligne.ends_at).toISOString(),
    course: {
      id: ligne.course_id,
      code: ligne.course_code,
      name: ligne.course_name,
    },
    questionCount: ligne.question_count,
    attemptCount: ligne.attempt_count,
    isLocked: ligne.attempt_count > 0,
  };
}

const SELECT_BASE = `
  SELECT e.id, e.title, e.description, e.starts_at, e.ends_at,
         c.id AS course_id, c.code AS course_code, c.name AS course_name,
         COUNT(DISTINCT q.id)::int AS question_count,
         COUNT(DISTINCT a.id)::int AS attempt_count
    FROM exams e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN questions q ON q.exam_id = e.id
    LEFT JOIN attempts a ON a.exam_id = e.id
`;

export async function findAllExams(): Promise<ExamListItem[]> {
  const resultat = await pool.query(
    `${SELECT_BASE} GROUP BY e.id, c.id ORDER BY e.starts_at DESC`
  );
  return resultat.rows.map((ligne: any) => ligneVersExamListItem(ligne));
}

export async function findExamById(id: number): Promise<ExamListItem | null> {
  const resultat = await pool.query(
    `${SELECT_BASE} WHERE e.id = $1 GROUP BY e.id, c.id`,
    [id]
  );
  return resultat.rowCount ? ligneVersExamListItem(resultat.rows[0]) : null;
}

export async function courseExists(courseId: number): Promise<boolean> {
  const resultat = await pool.query(`SELECT 1 FROM courses WHERE id = $1`, [courseId]);
  return (resultat.rowCount ?? 0) > 0;
}

export async function insertExam(input: ExamInput): Promise<number> {
  const resultat = await pool.query(
    `INSERT INTO exams (course_id, title, description, starts_at, ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [input.courseId, input.title, input.description ?? null, input.startsAt, input.endsAt]
  );
  return resultat.rows[0].id;
}

export async function updateExam(id: number, input: ExamInput): Promise<boolean> {
  const resultat = await pool.query(
    `UPDATE exams SET title = $1, description = $2, starts_at = $3, ends_at = $4
      WHERE id = $5`,
    [input.title, input.description ?? null, input.startsAt, input.endsAt, id]
  );
  return (resultat.rowCount ?? 0) > 0;
}

export async function countAttemptsForExam(id: number): Promise<number> {
  const resultat = await pool.query(
    `SELECT COUNT(*)::int AS total FROM attempts WHERE exam_id = $1`,
    [id]
  );
  return resultat.rows[0].total;
}

export async function deleteExam(id: number): Promise<void> {
  await pool.query(`DELETE FROM exams WHERE id = $1`, [id]);
}