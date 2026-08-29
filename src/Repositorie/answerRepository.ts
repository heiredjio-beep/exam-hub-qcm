import type { PoolClient } from 'pg';
import type { AnswerInput } from '../Model/attempt';

/**
 * Couche Repositorie/ — perimetre P5 (reponses et donnees de correction).
 * Toutes ces fonctions travaillent dans la transaction de soumission :
 * elles recoivent le client, jamais le pool.
 */

/** Une question avec sa bonne reponse — usage SERVEUR uniquement. */
export interface QuestionCorrigee {
  id: number;
  statement: string;
  points: number;
  bonChoixId: number;
  bonChoixLabel: string;
  /** Tous les choix de la question, pour retrouver le libelle choisi. */
  choix: Map<number, string>;
}

/**
 * Charge les questions de l'examen AVEC leur bonne reponse.
 *
 * RG-06 : c'est la seule source de verite pour la note. Le client n'envoie
 * que des identifiants, le serveur recharge les bonnes reponses depuis la
 * base et calcule lui-meme. Cette fonction ne doit jamais alimenter une
 * reponse HTTP avant la soumission.
 */
export async function findQuestionsAvecCorrection(
  client: PoolClient,
  examId: number
): Promise<QuestionCorrigee[]> {
  const resultat = await client.query(
    `SELECT q.id,
            q.statement,
            q.points,
            c.id         AS choice_id,
            c.label      AS choice_label,
            c.is_correct
       FROM questions q
       JOIN choices c ON c.question_id = q.id
      WHERE q.exam_id = $1
      ORDER BY q.position ASC, q.id ASC, c.id ASC`,
    [examId]
  );

  const parQuestion = new Map<number, QuestionCorrigee>();

  for (const ligne of resultat.rows) {
    let question = parQuestion.get(ligne.id);
    if (!question) {
      question = {
        id: ligne.id,
        statement: ligne.statement,
        points: ligne.points,
        bonChoixId: 0,
        bonChoixLabel: '',
        choix: new Map<number, string>(),
      };
      parQuestion.set(ligne.id, question);
    }
    question.choix.set(ligne.choice_id, ligne.choice_label);
    if (ligne.is_correct) {
      question.bonChoixId = ligne.choice_id;
      question.bonChoixLabel = ligne.choice_label;
    }
  }

  return [...parQuestion.values()];
}

/**
 * Insere les reponses de la tentative en une seule requete.
 * RG-05 : choiceId peut valoir null — la question est alors sans reponse
 * et vaut 0 point, mais la ligne est bien enregistree.
 */
export async function insertAnswers(
  client: PoolClient,
  attemptId: number,
  reponses: AnswerInput[]
): Promise<void> {
  if (reponses.length === 0) return;

  const valeurs: unknown[] = [];
  const lignes = reponses.map((reponse, index) => {
    const base = index * 3;
    valeurs.push(attemptId, reponse.questionId, reponse.choiceId);
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  });

  await client.query(
    `INSERT INTO answers (attempt_id, question_id, choice_id) VALUES ${lignes.join(', ')}`,
    valeurs
  );
}
