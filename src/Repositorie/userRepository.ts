import { pool } from '../db/pool';
import type { StudentSummary, User } from '../Model/user';

/**
 * Couche Repositorie/ — seule couche autorisee a parler a `pool`.
 * Perimetre P2 : utilisateurs (authentification + comptes etudiants).
 * Aucune requete ici ne construit du SQL par concatenation : tout passe
 * par des parametres $1, $2...
 */

function ligneVersUser(ligne: any): User {
  return {
    id: ligne.id,
    fullName: ligne.full_name,
    email: ligne.email,
    passwordHash: ligne.password_hash,
    role: ligne.role,
    isActive: ligne.is_active,
    createdAt: ligne.created_at,
  };
}

function ligneVersStudentSummary(ligne: any): StudentSummary {
  return {
    id: ligne.id,
    fullName: ligne.full_name,
    email: ligne.email,
    isActive: ligne.is_active,
  };
}

/** Retrouve un utilisateur par son email, ou null s'il n'existe pas. */
export async function findByEmail(email: string): Promise<User | null> {
  const resultat = await pool.query(
    `SELECT id, full_name, email, password_hash, role, is_active, created_at
       FROM users
      WHERE email = $1`,
    [email]
  );
  return resultat.rowCount ? ligneVersUser(resultat.rows[0]) : null;
}

/** Retrouve un utilisateur par son id, ou null s'il n'existe pas. */
export async function findById(id: number): Promise<User | null> {
  const resultat = await pool.query(
    `SELECT id, full_name, email, password_hash, role, is_active, created_at
       FROM users
      WHERE id = $1`,
    [id]
  );
  return resultat.rowCount ? ligneVersUser(resultat.rows[0]) : null;
}

/** Vrai si un compte utilise deja cet email. excludeId sert pour une modification. */
export async function existsByEmail(email: string, excludeId?: number): Promise<boolean> {
  const resultat = await pool.query(
    excludeId
      ? `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2) AS existe`
      : `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) AS existe`,
    excludeId ? [email, excludeId] : [email]
  );
  return resultat.rows[0].existe as boolean;
}

/** Liste des comptes etudiants, triee par nom. Jamais le hash. */
export async function findAllStudents(): Promise<StudentSummary[]> {
  const resultat = await pool.query(
    `SELECT id, full_name, email, is_active
       FROM users
      WHERE role = 'STUDENT'
      ORDER BY full_name ASC`
  );
  return resultat.rows.map(ligneVersStudentSummary);
}

/** Cree un compte etudiant actif. */
export async function createStudent(
  fullName: string,
  email: string,
  passwordHash: string
): Promise<StudentSummary> {
  const resultat = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'STUDENT', TRUE)
     RETURNING id, full_name, email, is_active`,
    [fullName, email, passwordHash]
  );
  return ligneVersStudentSummary(resultat.rows[0]);
}

/** Met a jour nom et email d'un compte etudiant. Le role n'est jamais touche ici. */
export async function updateStudent(
  id: number,
  fullName: string,
  email: string
): Promise<StudentSummary | null> {
  const resultat = await pool.query(
    `UPDATE users
        SET full_name = $2, email = $3
      WHERE id = $1 AND role = 'STUDENT'
     RETURNING id, full_name, email, is_active`,
    [id, fullName, email]
  );
  return resultat.rowCount ? ligneVersStudentSummary(resultat.rows[0]) : null;
}

/** Remplace le hash du mot de passe d'un compte etudiant. */
export async function updatePasswordHash(id: number, passwordHash: string): Promise<void> {
  await pool.query(
    `UPDATE users SET password_hash = $2 WHERE id = $1 AND role = 'STUDENT'`,
    [id, passwordHash]
  );
}

/** RG-10 : desactive/reactive un compte etudiant, ne supprime jamais la ligne. */
export async function setActive(id: number, isActive: boolean): Promise<StudentSummary | null> {
  const resultat = await pool.query(
    `UPDATE users
        SET is_active = $2
      WHERE id = $1 AND role = 'STUDENT'
     RETURNING id, full_name, email, is_active`,
    [id, isActive]
  );
  return resultat.rowCount ? ligneVersStudentSummary(resultat.rows[0]) : null;
}
