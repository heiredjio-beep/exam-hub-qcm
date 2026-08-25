import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env';
import { asyncHandler } from './middlewares/asyncHandler';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { pool } from './db/pool';

/**
 * Assemblage de l'application Express.
 *
 * Ce fichier appartient a P1 et a lui seul. Les autres membres n'y
 * touchent pas : leurs routes sont deja montees plus bas, ils remplissent
 * uniquement leur propre fichier dans src/routes/.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: false }));
  app.use(express.json({ limit: '1mb' }));

  /**
   * Sonde de vie : verifie que l'API repond ET que la base est joignable.
   * C'est la premiere chose a appeler quand une installation ne marche pas.
   */
  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'ok' });
    })
  );

  // --- Routes des verticales : montees ci-dessous ---

  // Toute route inconnue repond au format RG-13.
  app.use(notFoundHandler);

  // errorHandler est toujours le dernier middleware monte.
  app.use(errorHandler);

  return app;
}
