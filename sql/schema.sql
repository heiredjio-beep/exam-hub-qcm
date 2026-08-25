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
