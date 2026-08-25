import { Pool } from 'pg';
import { env } from '../config/env';

/**
 * Pool de connexions partage par toute l'application.
 *
 * Regle d'architecture : seule la couche Repositorie/ importe ce module.
 * Aucun pool.query ne doit apparaitre dans Controller/ ni dans Service/.
 */
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('[pool] client postgres inactif en erreur', error);
});

/**
 * Execute une suite de requetes dans une seule transaction.
 * Utilise par P4 (creation de question + choix) et par P5 (soumission notee).
 * En cas d'erreur, ROLLBACK puis remontee de l'erreur telle quelle.
 */
export async function withTransaction<T>(
  handler: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
