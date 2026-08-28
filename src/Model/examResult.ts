/** Une ligne de resultat : une tentative d'un etudiant sur l'examen. */
export interface ExamResultRow {
  attemptId: number;
  studentId: number;
  fullName: string;
  email: string;
  isActive: boolean;
  score: number;
  maxScore: number;
  submittedAt: string;
}

/** Agrege calcule en SQL (AVG, COUNT), jamais recalcule en JS. */
export interface ExamResultsSummary {
  average: number;
  attemptsCount: number;
}

export interface ExamResults {
  results: ExamResultRow[];
  summary: ExamResultsSummary;
}
