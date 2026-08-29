import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import type { Choice, ChoiceInput } from '../Model/choice';
import type { Question, QuestionWithChoices } from '../Model/question';

/**
 * Couche Repositorie/ — seule couche autorisee a parler a `pool`.
 * Perimetre P4 : questions + choices uniquement. Aucune requete ici ne
 * construit du SQL par concatenation : tout passe par des parametres $1, $2...
 */

function ligneVersQuestion(ligne: any): Question {
  return {
    id: ligne.id,
    examId: ligne.exam_id,
    statement: ligne.statement,
    points: ligne.points,
    position: ligne.position,
  };
}

function ligneVersChoice(ligne: any): Choice {
  return {
    id: ligne.id,
    questionId: ligne.question_id,
    label: ligne.label,
    isCorrect: ligne.is_correct,
  };
}

/** Toutes les questions d'un examen, triees par position, choix inclus. */
export async function findQuestionsByExam(examId: number): Promise<QuestionWithChoices[]> {
  const questions = await pool.query(
    `SELECT id, exam_id, statement, points, position
       FROM questions
      WHERE exam_id = $1
      ORDER BY position ASC`,
    [examId]
  );

  if (questions.rowCount === 0) {
    return [];
  }

  const ids = questions.rows.map((ligne) => ligne.id);
  const choix = await pool.query(
    `SELECT id, question_id, label, is_correct
       FROM choices
      WHERE question_id = ANY($1::int[])
      ORDER BY id ASC`,
    [ids]
  );

  const choixParQuestion = new Map<number, Choice[]>();
  for (const ligne of choix.rows) {
    const c = ligneVersChoice(ligne);
    const liste = choixParQuestion.get(c.questionId) ?? [];
    liste.push(c);
    choixParQuestion.set(c.questionId, liste);
  }

  return questions.rows.map((ligne) => ({
    ...ligneVersQuestion(ligne),
    choices: choixParQuestion.get(ligne.id) ?? [],
  }));
}

/** Une question seule, sans ses choix — sert a retrouver son exam_id (verrouillage RG-08). */
export async function findQuestionById(id: number): Promise<Question | null> {
  const resultat = await pool.query(
    `SELECT id, exam_id, statement, points, position
       FROM questions
      WHERE id = $1`,
    [id]
  );
  return resultat.rowCount ? ligneVersQuestion(resultat.rows[0]) : null;
}

/** Verifie que l'examen existe avant d'agir dessus (fix 404 vs 200 []). */
export async function examExists(examId: number): Promise<boolean> {
  const resultat = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM exams WHERE id = $1) AS existe`,
    [examId]
  );
  return resultat.rows[0].existe as boolean;
}

/** RG-08 : un examen est verrouille des qu'il porte au moins une tentative. */
export async function examHasAttempts(examId: number): Promise<boolean> {
  const resultat = await pool.query(
    `SELECT EXISTS(SELECT 1 FROM attempts WHERE exam_id = $1) AS existe`,
    [examId]
  );
  return resultat.rows[0].existe as boolean;
}

/** Prochaine position libre pour une nouvelle question de cet examen. */
export async function nextPosition(examId: number): Promise<number> {
  const resultat = await pool.query(
    `SELECT COALESCE(MAX(position), 0) + 1 AS suivante FROM questions WHERE exam_id = $1`,
    [examId]
  );
  return resultat.rows[0].suivante as number;
}

/** Insere la question ; doit toujours etre appele a l'interieur d'une transaction. */
export async function insertQuestion(
  client: PoolClient,
  examId: number,
  statement: string,
  points: number,
  position: number
): Promise<number> {
  const resultat = await client.query(
    `INSERT INTO questions (exam_id, statement, points, position)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [examId, statement, points, position]
  );
  return resultat.rows[0].id as number;
}

/** Insere tous les choix d'une question en une seule requete. */
export async function insertChoices(
  client: PoolClient,
  questionId: number,
  choices: ChoiceInput[]
): Promise<void> {
  const valeurs: unknown[] = [];
  const lignesSql = choices.map((choix, index) => {
    const base = index * 3;
    valeurs.push(questionId, choix.label, choix.isCorrect);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });

  await client.query(
    `INSERT INTO choices (question_id, label, is_correct) VALUES ${lignesSql.join(', ')}`,
    valeurs
  );
}

/** Met a jour l'enonce/bareme/position de la question. */
export async function updateQuestionFields(
  client: PoolClient,
  id: number,
  statement: string,
  points: number,
  position: number
): Promise<void> {
  await client.query(
    `UPDATE questions SET statement = $2, points = $3, position = $4 WHERE id = $1`,
    [id, statement, points, position]
  );
}

/** Supprime tous les choix existants d'une question avant de reinserer la nouvelle liste. */
export async function deleteChoicesByQuestion(client: PoolClient, questionId: number): Promise<void> {
  await client.query(`DELETE FROM choices WHERE question_id = $1`, [questionId]);
}

/** Supprime la question ; les choix partent en CASCADE (voir schema.sql). */
export async function deleteQuestion(client: PoolClient, id: number): Promise<void> {
  await client.query(`DELETE FROM questions WHERE id = $1`, [id]);
}
