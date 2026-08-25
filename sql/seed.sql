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

-- ---------------------------------------------------------------------
--  Cinq questions : trois sur le partiel ouvert, deux sur l'examen ferme
--  RG-04 : chaque question porte entre 2 et 6 choix, exactement un correct.
-- ---------------------------------------------------------------------
INSERT INTO questions (id, exam_id, statement, points, position) VALUES
  (1, 1, 'Que designe l''encapsulation en programmation orientee objet ?', 2, 1),
  (2, 1, 'Quel mot-cle Java empeche la redefinition d''une methode ?',     1, 2),
  (3, 1, 'Quelle structure garantit un acces en O(1) par cle ?',           3, 3),
  (4, 2, 'Quelle est la dimension du noyau d''une application injective ?', 2, 1),
  (5, 2, 'Une matrice carree est inversible si et seulement si :',          2, 2)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Choix de reponse
--  L'index unique partiel one_correct_choice_per_question refuserait
--  physiquement toute deuxieme ligne is_correct = TRUE sur une question.
-- ---------------------------------------------------------------------
INSERT INTO choices (id, question_id, label, is_correct) VALUES
  ( 1, 1, 'Le regroupement des donnees et des traitements dans une meme classe', TRUE),
  ( 2, 1, 'La creation automatique d''objets au demarrage',                      FALSE),
  ( 3, 1, 'La conversion implicite entre types primitifs',                       FALSE),

  ( 4, 2, 'final',    TRUE),
  ( 5, 2, 'static',   FALSE),
  ( 6, 2, 'abstract', FALSE),
  ( 7, 2, 'private',  FALSE),

  ( 8, 3, 'La table de hachage', TRUE),
  ( 9, 3, 'La liste chainee',    FALSE),
  (10, 3, 'L''arbre binaire de recherche', FALSE),

  (11, 4, 'Zero',      TRUE),
  (12, 4, 'Un',        FALSE),
  (13, 4, 'La dimension de l''espace de depart', FALSE),

  (14, 5, 'Son determinant est non nul', TRUE),
  (15, 5, 'Sa trace est non nulle',      FALSE),
  (16, 5, 'Elle est symetrique',         FALSE)
ON CONFLICT (id) DO NOTHING;
