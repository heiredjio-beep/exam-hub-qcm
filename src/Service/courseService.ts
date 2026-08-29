import { HttpError } from '../Security/httpError';
import type { Course, CourseInput, CourseWithExamCount } from '../Model/course';
import {
  countExamsForCourse,
  deleteCourse,
  findAllCourses,
  findCourseByCode,
  findCourseById,
  insertCourse,
  updateCourse,
} from '../Repositorie/courseRepository';

function normaliserCode(code: string): string {
  return code.trim().toUpperCase();
}

function validerInput(input: { code: string; name: string }): void {
  if (!input.code?.trim()) {
    throw HttpError.badRequest('Le code du cours est obligatoire.');
  }
  if (!input.name?.trim()) {
    throw HttpError.badRequest('Le nom du cours est obligatoire.');
  }
}

export async function listerCours(): Promise<CourseWithExamCount[]> {
  return findAllCourses();
}

export async function obtenirCoursOuEchouer(id: number): Promise<Course> {
  const cours = await findCourseById(id);
  if (!cours) {
    throw HttpError.notFound('Cours introuvable.');
  }
  return cours;
}

export async function creerCours(input: CourseInput): Promise<Course> {
  validerInput(input);
  const code = normaliserCode(input.code);
  const existant = await findCourseByCode(code);
  if (existant) {
    throw HttpError.conflict(`Le code de cours "${code}" est deja utilise.`);
  }
  return insertCourse({ ...input, code });
}

export async function modifierCours(id: number, input: CourseInput): Promise<Course> {
  validerInput(input);
  await obtenirCoursOuEchouer(id);
  const code = normaliserCode(input.code);
  const existant = await findCourseByCode(code);
  if (existant && existant.id !== id) {
    throw HttpError.conflict(`Le code de cours "${code}" est deja utilise.`);
  }
  const modifie = await updateCourse(id, { ...input, code });
  if (!modifie) {
    throw HttpError.notFound('Cours introuvable.');
  }
  return modifie;
}

export async function supprimerCours(id: number): Promise<void> {
  await obtenirCoursOuEchouer(id);
  const nombreExamens = await countExamsForCourse(id);
  if (nombreExamens > 0) {
    throw HttpError.conflict(
      `Ce cours contient ${nombreExamens} examen${nombreExamens > 1 ? 's' : ''} et ne peut pas etre supprime.`
    );
  }
  await deleteCourse(id);
}