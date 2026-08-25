-- =====================================================================
--  Exam Hub - donnees de demonstration
--
--  Ce fichier ne contient aucun compte : les utilisateurs sont inseres
--  par src/db/seed.ts, qui seul sait hacher un mot de passe avec bcrypt.
--
--  Les identifiants sont explicites et les insertions protegees par
--  ON CONFLICT DO NOTHING : le script peut etre rejoue sans creer de
--  doublon. Les sequences sont resynchronisees en fin de fichier.
-- =====================================================================

-- ---------------------------------------------------------------------
--  Deux cours
-- ---------------------------------------------------------------------
INSERT INTO courses (id, code, name, description) VALUES
  (1, 'PROG2', 'Programmation 2',   'Programmation orientee objet et structures de donnees.'),
  (2, 'MATH1', 'Mathematiques 1',   'Algebre lineaire et analyse elementaire.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Deux examens : un ouvert maintenant, un deja ferme
--
--  Les fenetres sont relatives a now(), l'examen ouvert le reste donc
--  quelle que soit la date a laquelle le seed est rejoue.
--  RG-03 : l'examen ferme doit etre invisible cote etudiant et refuse
--  en soumission directe par curl.
-- ---------------------------------------------------------------------
INSERT INTO exams (id, course_id, title, description, starts_at, ends_at) VALUES
  (1, 1, 'Partiel POO',
      'Examen ouvert, utilise pour la demonstration du parcours etudiant.',
      now() - interval '1 day',  now() + interval '7 days'),
  (2, 2, 'Controle continu 1',
      'Examen deja ferme, utilise pour demontrer RG-03.',
      now() - interval '10 days', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;
