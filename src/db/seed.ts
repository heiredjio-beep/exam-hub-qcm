import bcrypt from 'bcrypt';
import { env } from '../config/env';
import { pool, closePool } from './pool';

/** Mot de passe commun aux comptes de demonstration, documente dans le README. */
const MOT_DE_PASSE_ETUDIANT = 'Etudiant123!';

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

/**
 * Trois etudiants de demonstration, dont un desactive.
 *
 * RG-11 : le compte desactive sert a prouver que la connexion renvoie un
 * refus explicite ("Ce compte a ete desactive"), distinct du message
 * generique d'un mauvais mot de passe.
 * RG-10 : ce meme compte n'est jamais supprime, ses resultats restent
 * consultables par l'administrateur.
 */
const ETUDIANTS: ReadonlyArray<{ fullName: string; email: string; isActive: boolean }> = [
  { fullName: 'Rakoto Andry', email: 'andry@examhub.local', isActive: true },
  { fullName: 'Rasoa Miora', email: 'miora@examhub.local', isActive: true },
  { fullName: 'Randria Tiana', email: 'tiana@examhub.local', isActive: false },
];

async function seedEtudiants(): Promise<void> {
  const passwordHash = await bcrypt.hash(MOT_DE_PASSE_ETUDIANT, env.bcryptRounds);

  for (const etudiant of ETUDIANTS) {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'STUDENT', $4)
       ON CONFLICT (email) DO NOTHING`,
      [etudiant.fullName, etudiant.email.toLowerCase(), passwordHash, etudiant.isActive]
    );
  }

  console.log(
    `[seed] ${ETUDIANTS.length} etudiants en place, dont ${
      ETUDIANTS.filter((e) => !e.isActive).length
    } desactive`
  );
}

async function seed(): Promise<void> {
  await seedAdmin();
  await seedEtudiants();
}

seed()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('[seed] echec', error);
    await closePool();
    process.exit(1);
  });
