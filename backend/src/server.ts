import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Serveur exam-hub-backend démarré sur http://localhost:${PORT}`);
});