import { pool } from '../db/pool';
import type { Course, CourseInput, CourseWithExamCount } from '../Model/course';

function ligneVersCourse(ligne: any): Course {
  return {
    id: ligne.id,
    code: ligne.code,
    name: ligne.name,
    description: ligne.description,
  };
}

export async function findAllCourses(): Promise<CourseWithExamCount[]> {
  const resultat = await pool.query(
    `SELECT c.id, c.code, c.name, c.description,
            COUNT(e.id)::int AS exam_count
       FROM courses c
       LEFT JOIN exams e ON e.course_id = c.id
      GROUP BY c.id
      ORDER BY c.code`
  );
  return resultat.rows.map((ligne: any) => ({
    ...ligneVersCourse(ligne),
    examCount: ligne.exam_count,
  }));
}

export async function findCourseById(id: number): Promise<Course | null> {
  const resultat = await pool.query(
    `SELECT id, code, name, description FROM courses WHERE id = $1`,
    [id]
  );
  return resultat.rowCount ? ligneVersCourse(resultat.rows[0]) : null;
}

export async function findCourseByCode(code: string): Promise<Course | null> {
  const resultat = await pool.query(
    `SELECT id, code, name, description FROM courses WHERE code = $1`,
    [code]
  );
  return resultat.rowCount ? ligneVersCourse(resultat.rows[0]) : null;
}

export async function insertCourse(input: CourseInput): Promise<Course> {
  const resultat = await pool.query(
    `INSERT INTO courses (code, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, code, name, description`,
    [input.code, input.name, input.description ?? null]
  );
  return ligneVersCourse(resultat.rows[0]);
}

export async function updateCourse(id: number, input: CourseInput): Promise<Course | null> {
  const resultat = await pool.query(
    `UPDATE courses SET code = $1, name = $2, description = $3
      WHERE id = $4
      RETURNING id, code, name, description`,
    [input.code, input.name, input.description ?? null, id]
  );
  return resultat.rowCount ? ligneVersCourse(resultat.rows[0]) : null;
}

export async function countExamsForCourse(id: number): Promise<number> {
  const resultat = await pool.query(
    `SELECT COUNT(*)::int AS total FROM exams WHERE course_id = $1`,
    [id]
  );
  return resultat.rows[0].total;
}

export async function deleteCourse(id: number): Promise<void> {
  await pool.query(`DELETE FROM courses WHERE id = $1`, [id]);
}