import express from 'express';
import cors from 'cors';
import { errorHandler } from './Middlewares/errorHandler';
import { pool } from './Db/pool';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});


app.use(errorHandler);

export default app;