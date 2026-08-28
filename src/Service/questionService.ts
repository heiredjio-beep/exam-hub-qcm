import { withTransaction } from '../db/pool';
import { HttpError } from '../Security/httpError';
import type { ChoiceInput } from '../Model/choice';
import type { QuestionInput, QuestionWithChoices } from '../Model/question';
import {
  deleteChoicesByQuestion,
  deleteQuestion as supprimerQuestionEnBase,
  examExists,
  examHasAttempts,
  findQuestionById,
  findQuestionsByExam,
  insertChoices,
  insertQuestion,
  nextPosition,
  updateQuestionFields,
} from '../Repositorie/questionRepository';

/**
 * Couche Service/ — perimetre P4.
 * RG-04 (2 a 6 choix, exactement un correct, points > 0) et RG-08
 * (verrouillage des qu'un examen a une tentative) sont verifiees ici,
 * jamais dans le Controller ni laissees a la seule contrainte SQL.
 */

/** RG-04, premiere moitie : le nombre et la coherence des choix. */
function validerChoices(choices: ChoiceInput[]): void {
  if (choices.length < 2 || choices.length > 6) {
    throw HttpError.badRequest('Une question doit avoir entre 2 et 6 choix.');
  }

  const nombreCorrects = choices.filter((choix) => choix.isCorrect).length;
  if (nombreCorrects !== 1) {
    throw HttpError.badRequest('Une question doit avoir exactement une bonne reponse.');
  }

  const libelleVide = choices.some((choix) => choix.label.trim().length === 0);
  if (libelleVide) {
    throw HttpError.badRequest('Le libelle d\'un choix ne peut pas etre vide.');
  }
}

/** RG-04, seconde moitie : un bareme strictement positif. */
function validerPoints(points: number): void {
  if (!Number.isInteger(points) || points <= 0) {
    throw HttpError.badRequest('Le bareme de la question doit etre un entier strictement positif.');
  }
}

function validerEnonce(statement: string): void {
  if (statement.trim().length === 0) {
    throw HttpError.badRequest('L\'enonce de la question ne peut pas etre vide.');
  }
}

function validerQuestionInput(input: QuestionInput): void {
  validerEnonce(input.statement);
  validerPoints(input.points);
  validerChoices(input.choices);
}

/** RG-08 : leve un 409 si l'examen a deja au moins une tentative. */
async function assertExamenNonVerrouille(examId: number): Promise<void> {
  const verrouille = await examHasAttempts(examId);
  if (verrouille) {
    throw HttpError.conflict(
      'Cet examen a deja au moins une tentative : ses questions sont verrouillees.'
    );
  }
}

export async function listerQuestions(examId: number): Promise<QuestionWithChoices[]> {
  const existe = await examExists(examId);
  if (!existe) {
    throw HttpError.notFound('Examen introuvable.');
  }
  return findQuestionsByExam(examId);
}

export async function creerQuestion(
  examId: number,
  input: QuestionInput
): Promise<QuestionWithChoices> {
  validerQuestionInput(input);
  await assertExamenNonVerrouille(examId);

  const position = input.position ?? (await nextPosition(examId));

  const id = await withTransaction(async (client) => {
    const questionId = await insertQuestion(client, examId, input.statement, input.points, position);
    await insertChoices(client, questionId, input.choices);
    return questionId;
  });

  const question = await findQuestionById(id);
  const questions = await findQuestionsByExam(examId);
  const creee = questions.find((q) => q.id === id);
  if (!question || !creee) {
    // Ne devrait jamais arriver : on vient de l'inserer dans la meme fonction.
    throw HttpError.notFound('Question introuvable apres creation.');
  }
  return creee;
}

/**
 * Remplacement complet d'une question (enonce, bareme, position, choix).
 * L'id de l'examen n'est pas dans l'URL (PUT /api/questions/:id) : on le
 * retrouve via la question elle-meme pour verifier le verrouillage RG-08.
 */
export async function modifierQuestion(
  id: number,
  input: QuestionInput
): Promise<QuestionWithChoices> {
  const existante = await findQuestionById(id);
  if (!existante) {
    throw HttpError.notFound('Question introuvable.');
  }

  validerQuestionInput(input);
  await assertExamenNonVerrouille(existante.examId);

  const position = input.position ?? existante.position;

  await withTransaction(async (client) => {
    await updateQuestionFields(client, id, input.statement, input.points, position);
    await deleteChoicesByQuestion(client, id);
    await insertChoices(client, id, input.choices);
  });

  const questions = await findQuestionsByExam(existante.examId);
  const modifiee = questions.find((q) => q.id === id);
  if (!modifiee) {
    throw HttpError.notFound('Question introuvable apres modification.');
  }
  return modifiee;
}

export async function supprimerQuestion(id: number): Promise<void> {
  const existante = await findQuestionById(id);
  if (!existante) {
    throw HttpError.notFound('Question introuvable.');
  }

  await assertExamenNonVerrouille(existante.examId);

  await withTransaction(async (client) => {
    await supprimerQuestionEnBase(client, id);
  });
}
