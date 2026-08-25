import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pool, closePool } from './pool';

/**
 * Applique sql/schema.sql sur la base du conteneur.
 * Le script est rejouable : il supprime puis recree tout le schema,
 * on peut donc l'executer autant de fois que necessaire.
 */
async function migrate(): Promise<void> {
  const schemaPath = resolve(__dirname, '../../sql/schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');

  console.log(`[migrate] application de ${schemaPath}`);
  await pool.query(schema);

  const { rows } = await pool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name`
  );

  console.log(`[migrate] ${rows.length} tables en place : ${rows.map((r) => r.table_name).join(', ')}`);
}

migrate()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('[migrate] echec', error);
    await closePool();
    process.exit(1);
  });
