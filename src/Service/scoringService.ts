import type { QuestionCorrigee } from '../Repositorie/answerRepository';
import type { AnswerInput, QuestionCorrection } from '../Model/attempt';

/**
 * Moteur de notation — perimetre P5.
 *
 * RG-06 : la note est calculee ici, cote serveur, a partir des bonnes
 * reponses rechargees depuis la base. Le client n'envoie que des
 * identifiants de choix : aucun score, aucun booleen de justesse.
 * RG-05 : une question sans reponse, ou repondue avec choiceId a null,
 * vaut 0 point. La soumission partielle reste acceptee.
 */

export interface ResultatCalcul {
  score: number;
  maxScore: number;
  /** Reponses nettoyees, pretes a etre inserees. Une ligne par question. */
  reponsesAEnregistrer: AnswerInput[];
  corrections: QuestionCorrection[];
}

export function calculerNote(
  questions: QuestionCorrigee[],
  reponsesClient: AnswerInput[]
): ResultatCalcul {
  /**
   * On indexe les reponses du client par question.
   *
   * Les questionId qui n'appartiennent pas a cet examen sont ignores :
   * ils ne sont simplement jamais consultes, puisqu'on parcourt les
   * questions de l'examen et non la liste envoyee par le client. Un client
   * malveillant qui envoie la question d'un autre examen n'obtient rien.
   */
  const choixParQuestion = new Map<number, number | null>();
  for (const reponse of reponsesClient) {
    choixParQuestion.set(reponse.questionId, reponse.choiceId);
  }

  let score = 0;
  let maxScore = 0;
  const reponsesAEnregistrer: AnswerInput[] = [];
  const corrections: QuestionCorrection[] = [];

  for (const question of questions) {
    maxScore += question.points;

    const choixBrut = choixParQuestion.get(question.id) ?? null;

    /**
     * Un choiceId qui n'appartient pas a CETTE question est traite comme
     * une absence de reponse. C'est exactement ce qu'enverrait un client
     * qui tente de piocher le choix correct d'une autre question.
     */
    const choixValide =
      choixBrut !== null && question.choix.has(choixBrut) ? choixBrut : null;

    const correct = choixValide !== null && choixValide === question.bonChoixId;
    const pointsObtenus = correct ? question.points : 0;
    score += pointsObtenus;

    reponsesAEnregistrer.push({ questionId: question.id, choiceId: choixValide });

    corrections.push({
      questionId: question.id,
      statement: question.statement,
      points: question.points,
      pointsObtenus,
      choixEtudiantId: choixValide,
      choixEtudiantLabel: choixValide === null ? null : (question.choix.get(choixValide) ?? null),
      bonChoixId: question.bonChoixId,
      bonChoixLabel: question.bonChoixLabel,
      correct,
    });
  }

  return { score, maxScore, reponsesAEnregistrer, corrections };
}
