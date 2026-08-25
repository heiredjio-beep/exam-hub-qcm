import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env';
import { asyncHandler } from './middlewares/asyncHandler';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { pool } from './db/pool';
import { authRouter } from './routes/auth';
import { studentsRouter } from './routes/students';
import { coursesRouter } from './routes/courses';
import { examsRouter } from './routes/exams';
import { examQuestionsRouter } from './routes/examQuestions';
import { questionsRouter } from './routes/questions';
import { myRouter } from './routes/my';

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

  // --- Routes des verticales ---
  //
  // Les sept routers sont montes ici une fois pour toutes, des le socle.
  // Chaque membre remplit uniquement son fichier dans src/routes/ : plus
  // personne n'a de raison de modifier app.ts, donc plus de conflit Git
  // sur ce fichier partage.
  //
  // examQuestionsRouter (P4) est monte AVANT examsRouter (P3) sur le meme
  // prefixe : les chemins /:id/questions et /:id/results doivent etre
  // examines avant le /:id generique des examens.
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/exams', examQuestionsRouter);
  app.use('/api/exams', examsRouter);
  app.use('/api/questions', questionsRouter);
  app.use('/api/my', myRouter);

  // Toute route inconnue repond au format RG-13.
  app.use(notFoundHandler);

  // errorHandler est toujours le dernier middleware monte.
  app.use(errorHandler);

  return app;
}
