-- =====================================================================
--  Exam Hub - schema de base de donnees
--  Chaque contrainte qui porte une regle de gestion est annotee RG-xx.
--
--  Script rejouable : il supprime puis recree l'integralite du schema.
--  Ordre de suppression = inverse de l'ordre des dependances.
-- =====================================================================

DROP TABLE IF EXISTS answers  CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS choices  CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams    CASCADE;
DROP TABLE IF EXISTS courses  CASCADE;
DROP TABLE IF EXISTS users    CASCADE;

-- ---------------------------------------------------------------------
--  users : administrateurs et etudiants
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RG-01 : pas d'auto-inscription, mais l'unicite de l'email reste la
  -- garantie de base contre le doublon de compte (409 attendu cote API).
  CONSTRAINT users_email_unique UNIQUE (email),

  -- Email stocke systematiquement en minuscules : sans cela
  -- "Jean@x.fr" et "jean@x.fr" creeraient deux comptes distincts.
  -- La couche Service/ doit appliquer lower() avant tout INSERT/UPDATE.
  CONSTRAINT users_email_minuscules CHECK (email = lower(email)),

  -- Un seul role par utilisateur, et seulement ces deux valeurs.
  CONSTRAINT users_role_valide CHECK (role IN ('ADMIN', 'STUDENT')),

  CONSTRAINT users_nom_non_vide CHECK (length(btrim(full_name)) > 0)
);

-- RG-10 : un etudiant n'est jamais supprime physiquement, seulement
-- desactive. is_active porte cette regle ; aucune route ne fait de DELETE
-- sur cette table. RG-11 : is_active = FALSE doit produire un refus
-- explicite a la connexion, distinct d'un mauvais mot de passe.

-- ---------------------------------------------------------------------
--  courses : cours auxquels les examens sont rattaches
-- ---------------------------------------------------------------------
CREATE TABLE courses (
  id          SERIAL PRIMARY KEY,
  code        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Code fonctionnel unique (PROG2, MATH1...) : 409 attendu si deja pris.
  CONSTRAINT courses_code_unique UNIQUE (code),

  -- Code normalise en majuscules, sinon "prog2" et "PROG2" coexistent
  -- et l'unicite ne veut plus rien dire.
  CONSTRAINT courses_code_majuscules CHECK (code = upper(code)),

  CONSTRAINT courses_code_non_vide CHECK (length(btrim(code)) > 0),
  CONSTRAINT courses_nom_non_vide  CHECK (length(btrim(name)) > 0)
);

-- ---------------------------------------------------------------------
--  exams : un examen appartient a un cours et possede une fenetre
-- ---------------------------------------------------------------------
CREATE TABLE exams (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER     NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RG-09 : un cours qui porte des examens ne peut pas etre supprime.
  -- RESTRICT est le filet de securite ; le message lisible ("Ce cours
  -- contient 3 examens") reste produit par la couche Service/.
  CONSTRAINT exams_course_fk FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE RESTRICT,

  -- RG-03 : une fenetre inversee rendrait l'examen a jamais invisible.
  CONSTRAINT exams_fenetre_valide CHECK (ends_at > starts_at),

  CONSTRAINT exams_titre_non_vide CHECK (length(btrim(title)) > 0)
);

-- Rappel fuseau horaire : starts_at et ends_at sont des TIMESTAMPTZ,
-- donc stockes en UTC. Le front envoie et recoit de l'ISO 8601 en UTC ;
-- la conversion vers l'heure locale se fait uniquement a l'affichage.

-- ---------------------------------------------------------------------
--  questions : enonces d'un examen
-- ---------------------------------------------------------------------
CREATE TABLE questions (
  id        SERIAL PRIMARY KEY,
  exam_id   INTEGER NOT NULL,
  statement TEXT    NOT NULL,
  points    INTEGER NOT NULL,
  position  INTEGER NOT NULL DEFAULT 1,

  -- Supprimer un examen supprime ses questions. Ce CASCADE n'est jamais
  -- atteint quand des tentatives existent : RG-09 bloque en amont via
  -- attempts.exam_id ON DELETE RESTRICT.
  CONSTRAINT questions_exam_fk FOREIGN KEY (exam_id)
    REFERENCES exams (id) ON DELETE CASCADE,

  -- RG-04 : points strictement positifs, un bareme a 0 ou negatif est refuse.
  CONSTRAINT questions_points_positifs CHECK (points > 0),

  CONSTRAINT questions_enonce_non_vide CHECK (length(btrim(statement)) > 0),
  CONSTRAINT questions_position_positive CHECK (position > 0)
);

-- ---------------------------------------------------------------------
--  choices : propositions de reponse d'une question
-- ---------------------------------------------------------------------
CREATE TABLE choices (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL,
  label       TEXT    NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT choices_question_fk FOREIGN KEY (question_id)
    REFERENCES questions (id) ON DELETE CASCADE,

  CONSTRAINT choices_libelle_non_vide CHECK (length(btrim(label)) > 0)
);

-- RG-04, premiere moitie : au plus une bonne reponse par question.
-- Un index unique partiel ne compte que les lignes is_correct = TRUE,
-- donc plusieurs mauvaises reponses restent autorisees.
CREATE UNIQUE INDEX one_correct_choice_per_question
  ON choices (question_id)
  WHERE is_correct = TRUE;

-- RG-04, seconde moitie : "au moins une bonne reponse" et "entre 2 et 6
-- choix" ne sont pas exprimables proprement par une contrainte SQL.
-- Elles sont validees dans Service/ a la creation ET a la modification
-- (perimetre P4, branche feat/questions-validation-rg04).

-- ---------------------------------------------------------------------
--  attempts : une tentative d'un etudiant sur un examen
-- ---------------------------------------------------------------------
CREATE TABLE attempts (
  id           SERIAL PRIMARY KEY,
  exam_id      INTEGER     NOT NULL,
  student_id   INTEGER     NOT NULL,
  score        INTEGER     NOT NULL DEFAULT 0,
  max_score    INTEGER     NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RG-02 : une seule tentative par etudiant et par examen. C'est la
  -- garantie en base ; la verification serveur en transaction (P5) la
  -- double, et la violation 23505 doit etre traduite en 409 lisible.
  CONSTRAINT attempts_une_par_etudiant UNIQUE (exam_id, student_id),

  -- RG-09 : un examen qui a des tentatives n'est plus supprimable.
  CONSTRAINT attempts_exam_fk FOREIGN KEY (exam_id)
    REFERENCES exams (id) ON DELETE RESTRICT,

  -- RG-10 : un etudiant n'est jamais supprime, ses resultats restent
  -- consultables. RESTRICT interdit toute suppression physique.
  CONSTRAINT attempts_student_fk FOREIGN KEY (student_id)
    REFERENCES users (id) ON DELETE RESTRICT,

  -- RG-06 : la note est calculee cote serveur, elle ne peut pas depasser
  -- le bareme ni etre negative.
  CONSTRAINT attempts_score_borne CHECK (score >= 0 AND score <= max_score),
  CONSTRAINT attempts_bareme_positif CHECK (max_score >= 0)
);

-- ---------------------------------------------------------------------
--  answers : reponse donnee a une question dans une tentative
-- ---------------------------------------------------------------------
CREATE TABLE answers (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER NOT NULL,
  question_id INTEGER NOT NULL,

  -- RG-05 : choice_id nullable. NULL = question laissee sans reponse,
  -- elle vaut 0 point et la soumission partielle reste acceptee.
  choice_id   INTEGER,

  -- Une seule reponse enregistree par question dans une tentative.
  CONSTRAINT answers_une_par_question UNIQUE (attempt_id, question_id),

  CONSTRAINT answers_attempt_fk FOREIGN KEY (attempt_id)
    REFERENCES attempts (id) ON DELETE CASCADE,

  -- RESTRICT et non CASCADE : tant qu'une reponse pointe une question ou
  -- un choix, la suppression est refusee. RG-08 bloque deja ce cas en
  -- amont cote service, ceci est le filet de securite en base.
  CONSTRAINT answers_question_fk FOREIGN KEY (question_id)
    REFERENCES questions (id) ON DELETE RESTRICT,
  CONSTRAINT answers_choice_fk FOREIGN KEY (choice_id)
    REFERENCES choices (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
--  Index de parcours
--  Les jointures du projet sont toutes descendantes (cours -> examens ->
--  questions -> choix) : sans ces index, chaque page d'administration
--  declenche un scan sequentiel complet.
-- ---------------------------------------------------------------------
CREATE INDEX idx_exams_course_id      ON exams (course_id);
CREATE INDEX idx_questions_exam_id    ON questions (exam_id, position);
CREATE INDEX idx_choices_question_id  ON choices (question_id);
CREATE INDEX idx_attempts_student_id  ON attempts (student_id);
CREATE INDEX idx_attempts_exam_id     ON attempts (exam_id);
CREATE INDEX idx_answers_attempt_id   ON answers (attempt_id);

-- RG-03 : la liste des examens ouverts filtre sur la fenetre courante
-- (NOW() BETWEEN starts_at AND ends_at), comparaison faite en SQL.
CREATE INDEX idx_exams_fenetre ON exams (starts_at, ends_at);
