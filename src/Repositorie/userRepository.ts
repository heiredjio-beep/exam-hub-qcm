import { pool } from '../db/pool';
import type { User } from '../Model/user';

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
