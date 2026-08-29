/** Choix de reponse tel que stocke/renvoye par l'API — table `choices`. */
export interface Choice {
  id: number;
  questionId: number;
  label: string;
  isCorrect: boolean;
}

/** Choix tel que recu du client, sans id (pas encore en base). */
export interface ChoiceInput {
  label: string;
  isCorrect: boolean;
}
