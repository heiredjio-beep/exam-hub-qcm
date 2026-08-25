import { createApp } from './app';
import { env } from './config/env';
import { closePool } from './db/pool';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[server] API Exam Hub sur http://localhost:${env.port}/api`);
  console.log(`[server] base ${env.db.database} sur ${env.db.host}:${env.db.port}`);
  console.log(`[server] origine autorisee ${env.corsOrigin}`);
});

/** Arret propre : on ferme le pool pour ne pas laisser de connexion ouverte. */
async function arreter(signal: string): Promise<void> {
  console.log(`[server] ${signal} recu, arret en cours`);
  server.close();
  await closePool();
  process.exit(0);
}

process.on('SIGINT', () => void arreter('SIGINT'));
process.on('SIGTERM', () => void arreter('SIGTERM'));
