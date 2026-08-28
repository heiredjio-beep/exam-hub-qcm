-- =====================================================================
--  Exam Hub - donnees de demonstration
--
--  Ce fichier ne contient aucun compte : les utilisateurs sont inseres
--  par src/db/seed.ts, qui seul sait hacher un mot de passe avec bcrypt.
--
--  Les identifiants sont explicites et les insertions protegees par
--  ON CONFLICT DO NOTHING : le script peut etre rejoue sans creer de
--  doublon. Les sequences sont resynchronisees en fin de fichier.
--
--  Jeu de donnees pour la soutenance : 2 cours, 3 examens, 15 questions.
--  L'examen 3 porte deja une tentative pour demontrer RG-08 en direct
--  (toute ecriture dessus doit renvoyer 409).
-- =====================================================================

-- ---------------------------------------------------------------------
--  Deux cours
-- ---------------------------------------------------------------------
INSERT INTO courses (id, code, name, description) VALUES
  (1, 'PROG2', 'Programmation 2',   'Programmation orientee objet et structures de donnees.'),
  (2, 'MATH1', 'Mathematiques 1',   'Algebre lineaire et analyse elementaire.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Trois examens :
--    1. ouvert et non verrouille -> demonstration du parcours etudiant
--    2. deja ferme -> demonstration de RG-03
--    3. ouvert mais deja verrouille (une tentative existe) -> RG-08
--
--  Les fenetres sont relatives a now(), les examens ouverts le restent
--  donc quelle que soit la date a laquelle le seed est rejoue.
-- ---------------------------------------------------------------------
INSERT INTO exams (id, course_id, title, description, starts_at, ends_at) VALUES
  (1, 1, 'Partiel POO',
      'Examen ouvert, utilise pour la demonstration du parcours etudiant.',
      now() - interval '1 day',  now() + interval '7 days'),
  (2, 2, 'Controle continu 1',
      'Examen deja ferme, utilise pour demontrer RG-03.',
      now() - interval '10 days', now() - interval '3 days'),
  (3, 1, 'Examen verrouille (demo RG-08)',
      'Examen deja passe par un etudiant : toute ecriture sur ses questions doit renvoyer 409.',
      now() - interval '2 days', now() + interval '5 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Quinze questions : cinq par examen.
--  RG-04 : chaque question porte entre 2 et 6 choix, exactement un correct.
-- ---------------------------------------------------------------------
INSERT INTO questions (id, exam_id, statement, points, position) VALUES
  -- Examen 1 - Partiel POO (ouvert, non verrouille)
  ( 1, 1, 'Que designe l''encapsulation en programmation orientee objet ?', 2, 1),
  ( 2, 1, 'Quel mot-cle Java empeche la redefinition d''une methode ?',     1, 2),
  ( 3, 1, 'Quelle structure garantit un acces en O(1) par cle ?',           3, 3),
  ( 6, 1, 'Que permet le polymorphisme en programmation orientee objet ?', 2, 4),
  ( 7, 1, 'Quelle complexite a une recherche dichotomique sur un tableau trie ?', 2, 5),

  -- Examen 2 - Controle continu 1 (ferme)
  ( 4, 2, 'Quelle est la dimension du noyau d''une application injective ?', 2, 1),
  ( 5, 2, 'Une matrice carree est inversible si et seulement si :',          2, 2),
  ( 8, 2, 'Que vaut le determinant d''une matrice triangulaire ?',           2, 3),
  ( 9, 2, 'Deux vecteurs sont orthogonaux si leur produit scalaire est :',   1, 4),
  (10, 2, 'Un systeme lineaire homogene admet toujours au moins :',         1, 5),

  -- Examen 3 - deja verrouille (demo RG-08)
  (11, 3, 'Que renvoie une requete SQL avec une jointure INNER JOIN sans correspondance ?', 2, 1),
  (12, 3, 'Quelle commande Git cree une nouvelle branche et bascule dessus ?',              1, 2),
  (13, 3, 'Que garantit une transaction SQL avec COMMIT/ROLLBACK ?',                        2, 3),
  (14, 3, 'Quel code HTTP signale un conflit avec l''etat courant de la ressource ?',        1, 4),
  (15, 3, 'Que fait une contrainte FOREIGN KEY ON DELETE RESTRICT ?',                        2, 5)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Choix de reponse
--  L'index unique partiel one_correct_choice_per_question refuserait
--  physiquement toute deuxieme ligne is_correct = TRUE sur une question.
-- ---------------------------------------------------------------------
INSERT INTO choices (id, question_id, label, is_correct) VALUES
  -- Question 1
  ( 1, 1, 'Le regroupement des donnees et des traitements dans une meme classe', TRUE),
  ( 2, 1, 'La creation automatique d''objets au demarrage',                      FALSE),
  ( 3, 1, 'La conversion implicite entre types primitifs',                       FALSE),

  -- Question 2
  ( 4, 2, 'final',    TRUE),
  ( 5, 2, 'static',   FALSE),
  ( 6, 2, 'abstract', FALSE),
  ( 7, 2, 'private',  FALSE),

  -- Question 3
  ( 8, 3, 'La table de hachage', TRUE),
  ( 9, 3, 'La liste chainee',    FALSE),
  (10, 3, 'L''arbre binaire de recherche', FALSE),

  -- Question 4
  (11, 4, 'Zero',      TRUE),
  (12, 4, 'Un',        FALSE),
  (13, 4, 'La dimension de l''espace de depart', FALSE),

  -- Question 5
  (14, 5, 'Son determinant est non nul', TRUE),
  (15, 5, 'Sa trace est non nulle',      FALSE),
  (16, 5, 'Elle est symetrique',         FALSE),

  -- Question 6
  (17, 6, 'Qu''un objet soit manipule via le type de sa classe mere tout en executant le comportement de sa classe reelle', TRUE),
  (18, 6, 'Que plusieurs classes partagent le meme nom de methode sans lien entre elles', FALSE),
  (19, 6, 'Que la memoire soit liberee automatiquement', FALSE),

  -- Question 7
  (20, 7, 'O(log n)', TRUE),
  (21, 7, 'O(n)',     FALSE),
  (22, 7, 'O(1)',     FALSE),
  (23, 7, 'O(n log n)', FALSE),

  -- Question 8
  (24, 8, 'Le produit des elements de la diagonale', TRUE),
  (25, 8, 'La somme des elements de la diagonale',   FALSE),
  (26, 8, 'Toujours zero',                            FALSE),

  -- Question 9
  (27, 9, 'Nul', TRUE),
  (28, 9, 'Positif', FALSE),
  (29, 9, 'Negatif', FALSE),

  -- Question 10
  (30, 10, 'La solution nulle', TRUE),
  (31, 10, 'Une infinite de solutions', FALSE),
  (32, 10, 'Aucune solution', FALSE),

  -- Question 11
  (33, 11, 'Aucune ligne pour cette table', TRUE),
  (34, 11, 'Une ligne avec des NULL a la place', FALSE),
  (35, 11, 'Une erreur SQL', FALSE),

  -- Question 12
  (36, 12, 'git checkout -b', TRUE),
  (37, 12, 'git branch',      FALSE),
  (38, 12, 'git switch --list', FALSE),
  (39, 12, 'git merge -b',    FALSE),

  -- Question 13
  (40, 13, 'Que toutes les ecritures de la transaction sont appliquees ensemble, ou aucune', TRUE),
  (41, 13, 'Que les ecritures sont toujours appliquees immediatement', FALSE),
  (42, 13, 'Que la table est verrouillee pour toujours', FALSE),

  -- Question 14
  (43, 14, '409', TRUE),
  (44, 14, '404', FALSE),
  (45, 14, '500', FALSE),
  (46, 14, '400', FALSE),

  -- Question 15
  (47, 15, 'Elle refuse la suppression de la ligne referencee tant qu''une ligne y fait reference', TRUE),
  (48, 15, 'Elle supprime automatiquement les lignes qui y font reference', FALSE),
  (49, 15, 'Elle met la reference a NULL',                                  FALSE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Tentative sur l'examen 3 : demonstration de RG-08 (verrouillage).
--
--  P5 (espace etudiant et moteur de notation) n'a pas encore commence :
--  il n'existe donc pas encore de route qui cree une tentative via
--  l'API. On l'insere ici directement pour pouvoir demontrer des
--  maintenant que toute ecriture sur les questions de l'examen 3
--  (creation, modification, suppression) renvoie bien 409.
--
--  student_id est retrouve par email plutot que par id fixe : les
--  comptes etudiants sont crees par seed.ts avant que ce fichier ne
--  soit execute, mais rien ne garantit l'ordre de leurs id.
--
--  max_score = somme des points des 5 questions de l'examen 3
--  (2 + 1 + 2 + 1 + 2 = 8) ; score = 6 (deux questions manquees).
-- ---------------------------------------------------------------------
INSERT INTO attempts (id, exam_id, student_id, score, max_score, submitted_at)
SELECT 1, 3, u.id, 6, 8, now() - interval '1 hour'
FROM users u
WHERE u.email = 'andry@examhub.local'
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
--  Resynchronisation des sequences
--
--  Indispensable : les insertions ci-dessus fixent les identifiants a la
--  main, les sequences SERIAL sont donc restees a 1. Sans ce bloc, la
--  premiere creation de cours par l'API tenterait de reutiliser l'id 1
--  et echouerait sur une violation de cle primaire.
--
--  is_called = false fait que le prochain nextval() renvoie exactement
--  la valeur passee, sans l'incrementer une fois de plus.
-- ---------------------------------------------------------------------
SELECT setval(pg_get_serial_sequence('users',     'id'), COALESCE((SELECT MAX(id) FROM users),     0) + 1, false);
SELECT setval(pg_get_serial_sequence('courses',   'id'), COALESCE((SELECT MAX(id) FROM courses),   0) + 1, false);
SELECT setval(pg_get_serial_sequence('exams',     'id'), COALESCE((SELECT MAX(id) FROM exams),     0) + 1, false);
SELECT setval(pg_get_serial_sequence('questions', 'id'), COALESCE((SELECT MAX(id) FROM questions), 0) + 1, false);
SELECT setval(pg_get_serial_sequence('choices',   'id'), COALESCE((SELECT MAX(id) FROM choices),   0) + 1, false);
SELECT setval(pg_get_serial_sequence('attempts',  'id'), COALESCE((SELECT MAX(id) FROM attempts),  0) + 1, false);
SELECT setval(pg_get_serial_sequence('answers',   'id'), COALESCE((SELECT MAX(id) FROM answers),   0) + 1, false);
