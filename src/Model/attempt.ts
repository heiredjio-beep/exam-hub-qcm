/**
 * Types de l'espace etudiant — perimetre P5.
 * snake_case en base, camelCase ici et dans les reponses JSON.
 */

/** Une tentative enregistree. */
export interface Attempt {
  id: number;
  examId: number;
  studentId: number;
  score: number;
  maxScore: number;
  submittedAt: string;
}

/** Un examen tel qu'il apparait dans la liste de l'etudiant. */
export interface AvailableExam {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  courseCode: string;
  courseName: string;
  questionCount: number;
}

/**
 * Un choix envoye a l'etudiant pendant le passage.
 * RG-07 : ce type ne porte volontairement AUCUN champ isCorrect.
 * Ne pas l'ajouter : il partirait directement dans la reponse HTTP.
 */
export interface StudentChoice {
  id: number;
  label: string;
}

/** Une question telle qu'elle est envoyee a l'etudiant. */
export interface StudentQuestion {
  id: number;
  statement: string;
  points: number;
  position: number;
  choices: StudentChoice[];
}

/** L'examen complet envoye a l'etudiant au moment du passage. */
export interface StudentExam {
  id: number;
  title: string;
  description: string | null;
  endsAt: string;
  courseCode: string;
  courseName: string;
  totalPoints: number;
  questions: StudentQuestion[];
}

/** Une reponse envoyee par le client : uniquement des identifiants (RG-06). */
export interface AnswerInput {
  questionId: number;
  choiceId: number | null;
}

/** Correction d'une question, renvoyee apres soumission (RG-12). */
export interface QuestionCorrection {
  questionId: number;
  statement: string;
  points: number;
  pointsObtenus: number;
  choixEtudiantId: number | null;
  choixEtudiantLabel: string | null;
  bonChoixId: number;
  bonChoixLabel: string;
  correct: boolean;
}

/** Resultat complet renvoye immediatement apres la soumission (RG-12). */
export interface AttemptResult {
  attemptId: number;
  examId: number;
  examTitle: string;
  score: number;
  maxScore: number;
  pourcentage: number;
  submittedAt: string;
  corrections: QuestionCorrection[];
}

/** Une ligne de l'historique personnel de l'etudiant. */
export interface AttemptHistoryItem {
  attemptId: number;
  examId: number;
  examTitle: string;
  courseCode: string;
  courseName: string;
  score: number;
  maxScore: number;
  pourcentage: number;
  submittedAt: string;
}
