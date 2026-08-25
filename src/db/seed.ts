import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { pool, closePool } from './pool';

/**
 * Jeu de donnees initial.
 *
 * RG-01 : il n'existe aucune route d'inscription. Le tout premier
 * administrateur ne peut donc etre cree que par ce script. Sans lui,
 * personne ne peut se connecter a l'application.
 *
 * Le script est idempotent : le relancer sur une base deja peuplee ne
 * cree pas de doublon et ne leve pas d'erreur.
 */
async function seedAdmin(): Promise<void> {
  const email = env.seed.adminEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(env.seed.adminPassword, env.bcryptRounds);

  const { rowCount } = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'ADMIN', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    ['Administrateur Exam Hub', email, passwordHash]
  );

  console.log(
    rowCount === 1
      ? `[seed] administrateur cree : ${email}`
      : `[seed] administrateur deja present : ${email}`
  );
}

async function seed(): Promise<void> {
  await seedAdmin();
}

seed()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('[seed] echec', error);
    await closePool();
    process.exit(1);
  });
