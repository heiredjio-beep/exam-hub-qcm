import { HttpError } from '../Security/httpError';
import type { ExamInput, ExamListItem } from '../Model/exam';
import {
  countAttemptsForExam,
  courseExists,
  deleteExam,
  findAllExams,
  findExamById,
  insertExam,
  updateExam,
} from '../Repositorie/examRepository';

function validerFenetre(startsAt: string, endsAt: string): void {
  const debut = new Date(startsAt);
  const fin = new Date(endsAt);
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    throw HttpError.badRequest('Les dates de la fenetre sont invalides.');
  }
  if (fin.getTime() <= debut.getTime()) {
    throw HttpError.badRequest('La date de fin doit etre posterieure a la date de debut.');
  }
}

export async function listerExamens(): Promise<ExamListItem[]> {
  return findAllExams();
}

export async function obtenirExamenOuEchouer(id: number): Promise<ExamListItem> {
  const examen = await findExamById(id);
  if (!examen) {
    throw HttpError.notFound('Examen introuvable.');
  }
  return examen;
}

export async function creerExamen(input: ExamInput): Promise<ExamListItem> {
  if (!input.title?.trim()) {
    throw HttpError.badRequest("Le titre de l'examen est obligatoire.");
  }
  if (!input.courseId) {
    throw HttpError.badRequest("Le cours de l'examen est obligatoire.");
  }
  const existeCours = await courseExists(input.courseId);
  if (!existeCours) {
    throw HttpError.notFound('Le cours indique est introuvable.');
  }
  validerFenetre(input.startsAt, input.endsAt);
  const id = await insertExam(input);
  return obtenirExamenOuEchouer(id);
}

export async function modifierExamen(id: number, input: ExamInput): Promise<ExamListItem> {
  await obtenirExamenOuEchouer(id);
  if (!input.title?.trim()) {
    throw HttpError.badRequest("Le titre de l'examen est obligatoire.");
  }
  validerFenetre(input.startsAt, input.endsAt);
  await updateExam(id, input);
  return obtenirExamenOuEchouer(id);
}

export async function supprimerExamen(id: number): Promise<void> {
  await obtenirExamenOuEchouer(id);
  const nombreTentatives = await countAttemptsForExam(id);
  if (nombreTentatives > 0) {
    throw HttpError.conflict(
      `Cet examen a deja ete passe par ${nombreTentatives} etudiant${nombreTentatives > 1 ? 's' : ''} et ne peut pas etre supprime.`
    );
  }
  await deleteExam(id);
}