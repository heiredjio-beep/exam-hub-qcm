import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import type {
  Attempt,
  AttemptHistoryItem,
  AvailableExam,
  StudentExam,
  StudentQuestion,
} from '../Model/attempt';

/**
 * Couche Repositorie/ — perimetre P5 (tentatives).
 * Seule couche autorisee a parler a `pool`. Tout est parametre.
 */

function ligneVersAttempt(ligne: any): Attempt {
  return {
    id: ligne.id,
    examId: ligne.exam_id,
    studentId: ligne.student_id,
    score: ligne.score,
    maxScore: ligne.max_score,
    submittedAt: ligne.submitted_at,
  };
}

/**
 * Examens ouverts MAINTENANT et pas encore passes par cet etudiant.
 *
 * RG-03 : la fenetre est comparee en SQL avec now(), jamais en JavaScript —
 * l'horloge du serveur fait foi, pas celle du navigateur.
 * RG-02 : l'exclusion des examens deja passes se fait par NOT EXISTS,
 * dans la meme requete, sans boucle.
 */
export async function findAvailableExams(studentId: number): Promise<AvailableExam[]> {
  const resultat = await pool.query(
    `SELECT e.id,
            e.title,
            e.description,
            e.starts_at,
            e.ends_at,
            c.code AS course_code,
            c.name AS course_name,
            (SELECT count(*) FROM questions q WHERE q.exam_id = e.id) AS question_count
       FROM exams e
       JOIN courses c ON c.id = e.course_id
      WHERE now() BETWEEN e.starts_at AND e.ends_at
        AND NOT EXISTS (
              SELECT 1 FROM attempts a
               WHERE a.exam_id = e.id AND a.student_id = $1
            )
      ORDER BY e.ends_at ASC`,
    [studentId]
  );

  return resultat.rows.map((ligne) => ({
    id: ligne.id,
    title: ligne.title,
    description: ligne.description,
    startsAt: ligne.starts_at,
    endsAt: ligne.ends_at,
    courseCode: ligne.course_code,
    courseName: ligne.course_name,
    questionCount: Number(ligne.question_count),
  }));
}

/** La tentative de cet etudiant sur cet examen, ou null. Sert a RG-02. */
export async function findAttempt(examId: number, studentId: number): Promise<Attempt | null> {
  const resultat = await pool.query(
    `SELECT id, exam_id, student_id, score, max_score, submitted_at
       FROM attempts
      WHERE exam_id = $1 AND student_id = $2`,
    [examId, studentId]
  );
  return resultat.rowCount ? ligneVersAttempt(resultat.rows[0]) : null;
}

/** Historique personnel, du plus recent au plus ancien, trie en SQL. */
export async function findHistory(studentId: number): Promise<AttemptHistoryItem[]> {
  const resultat = await pool.query(
    `SELECT a.id AS attempt_id,
            a.score,
            a.max_score,
            a.submitted_at,
            e.id AS exam_id,
            e.title AS exam_title,
            c.code AS course_code,
            c.name AS course_name
       FROM attempts a
       JOIN exams e   ON e.id = a.exam_id
       JOIN courses c ON c.id = e.course_id
      WHERE a.student_id = $1
      ORDER BY a.submitted_at DESC`,
    [studentId]
  );

  return resultat.rows.map((ligne) => ({
    attemptId: ligne.attempt_id,
    examId: ligne.exam_id,
    examTitle: ligne.exam_title,
    courseCode: ligne.course_code,
    courseName: ligne.course_name,
    score: ligne.score,
    maxScore: ligne.max_score,
    pourcentage: ligne.max_score > 0 ? Math.round((ligne.score / ligne.max_score) * 100) : 0,
    submittedAt: ligne.submitted_at,
  }));
}

/** Insere la tentative. Toujours appele a l'interieur d'une transaction. */
export async function insertAttempt(
  client: PoolClient,
  examId: number,
  studentId: number,
  score: number,
  maxScore: number
): Promise<Attempt> {
  const resultat = await client.query(
    `INSERT INTO attempts (exam_id, student_id, score, max_score)
     VALUES ($1, $2, $3, $4)
     RETURNING id, exam_id, student_id, score, max_score, submitted_at`,
    [examId, studentId, score, maxScore]
  );
  return ligneVersAttempt(resultat.rows[0]);
}

/** Etat d'un examen du point de vue de la fenetre, sans charger les questions. */
export interface ExamWindow {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  courseCode: string;
  courseName: string;
  ouvert: boolean;
}

/** Retrouve un examen et dit si sa fenetre est ouverte maintenant (RG-03). */
export async function findExamWindow(examId: number): Promise<ExamWindow | null> {
  const resultat = await pool.query(
    `SELECT e.id,
            e.title,
            e.description,
            e.starts_at,
            e.ends_at,
            c.code AS course_code,
            c.name AS course_name,
            (now() BETWEEN e.starts_at AND e.ends_at) AS ouvert
       FROM exams e
       JOIN courses c ON c.id = e.course_id
      WHERE e.id = $1`,
    [examId]
  );
  if (!resultat.rowCount) return null;

  const ligne = resultat.rows[0];
  return {
    id: ligne.id,
    title: ligne.title,
    description: ligne.description,
    startsAt: ligne.starts_at,
    endsAt: ligne.ends_at,
    courseCode: ligne.course_code,
    courseName: ligne.course_name,
    ouvert: ligne.ouvert,
  };
}

/**
 * Questions et choix d'un examen, VERSION ETUDIANT.
 *
 * RG-07 : la colonne is_correct n'est pas dans le SELECT. Ce n'est pas un
 * filtre applique apres coup en JavaScript — la donnee ne quitte jamais la
 * base. Ne jamais ajouter is_correct ici : il partirait dans la reponse HTTP
 * et serait visible dans l'onglet reseau du navigateur.
 */
export async function findQuestionsPourEtudiant(examId: number): Promise<StudentQuestion[]> {
  const questions = await pool.query(
    `SELECT id, statement, points, position
       FROM questions
      WHERE exam_id = $1
      ORDER BY position ASC, id ASC`,
    [examId]
  );
  if (questions.rowCount === 0) return [];

  const ids = questions.rows.map((ligne) => ligne.id);
  const choix = await pool.query(
    `SELECT id, question_id, label
       FROM choices
      WHERE question_id = ANY($1::int[])
      ORDER BY id ASC`,
    [ids]
  );

  const parQuestion = new Map<number, { id: number; label: string }[]>();
  for (const ligne of choix.rows) {
    const liste = parQuestion.get(ligne.question_id) ?? [];
    liste.push({ id: ligne.id, label: ligne.label });
    parQuestion.set(ligne.question_id, liste);
  }

  return questions.rows.map((ligne) => ({
    id: ligne.id,
    statement: ligne.statement,
    points: ligne.points,
    position: ligne.position,
    choices: parQuestion.get(ligne.id) ?? [],
  }));
}

/** Assemble l'examen complet envoye a l'etudiant pendant le passage. */
export async function findStudentExam(examId: number): Promise<StudentExam | null> {
  const examen = await findExamWindow(examId);
  if (!examen) return null;

  const questions = await findQuestionsPourEtudiant(examId);

  return {
    id: examen.id,
    title: examen.title,
    description: examen.description,
    endsAt: examen.endsAt,
    courseCode: examen.courseCode,
    courseName: examen.courseName,
    totalPoints: questions.reduce((total, q) => total + q.points, 0),
    questions,
  };
}
