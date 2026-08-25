import dotenv from 'dotenv';

dotenv.config();

/**
 * Point d'entree unique de la configuration.
 * Aucune autre couche ne lit process.env directement : si une variable manque,
 * le serveur refuse de demarrer ici plutot que de tomber en pleine requete.
 */
function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copiez .env.example vers .env.`
    );
  }
  return value.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Variable d'environnement invalide : ${name} doit etre un entier positif.`);
  }
  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: optionalNumber('PORT', 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  db: {
    host: required('PGHOST'),
    port: optionalNumber('PGPORT', 5433),
    user: required('PGUSER'),
    password: required('PGPASSWORD'),
    database: required('PGDATABASE'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  },

  bcryptRounds: optionalNumber('BCRYPT_ROUNDS', 10),

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'admin@examhub.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
