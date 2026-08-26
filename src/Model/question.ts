import type { Choice, ChoiceInput } from './choice';

/**
 * Question telle que stockee/renvoyee par l'API.
 * Perimetre P4 — table `questions` (voir sql/schema.sql).
 */
export interface Question {
  id: number;
  examId: number;
  statement: string;
  points: number;
  position: number;
}

/** Question avec ses choix imbriques (reponse de GET /api/exams/:id/questions). */
export interface QuestionWithChoices extends Question {
  choices: Choice[];
}

/**
 * Donnees recues du client pour creer/remplacer une question (POST, PUT).
 * `position` est optionnel : si absent, le service la calcule (derniere + 1).
 */
export interface QuestionInput {
  statement: string;
  points: number;
  position?: number;
  choices: ChoiceInput[];
}
