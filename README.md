# Exam Hub — Backend

API REST du gestionnaire d'examens QCM.

**Node.js + Express en TypeScript · PostgreSQL en SQL brut (aucun ORM) · JWT**

Dépôt frontend associé : [Examen-hub-qcm-frontEnd](https://github.com/heiredjio-beep/Examen-hub-qcm-frontEnd)

---

## Prérequis

| Outil | Version testée |
|---|---|
| Node.js | 20 ou plus (testé en 24.12) |
| npm | 10 ou plus |
| Docker Desktop | avec Docker Compose v2 |

Aucune installation de PostgreSQL n'est nécessaire : la base tourne dans un conteneur dédié.

---

## Installation

```bash
git clone https://github.com/heiredjio-beep/exam-hub-qcm.git
cd exam-hub-qcm

cp .env.example .env      # sous Windows PowerShell : copy .env.example .env
npm install

docker compose up -d      # démarre PostgreSQL
npm run db:reset          # crée le schéma puis insère les données de démonstration
npm run dev               # API sur http://localhost:4000/api
```

Vérification immédiate :

```bash
curl http://localhost:4000/api/health
# {"status":"ok","database":"ok"}
```

Si cette route ne répond pas, rien d'autre ne fonctionnera. Commencez toujours par elle.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Démarre l'API en rechargement automatique |
| `npm run build` | Compile TypeScript vers `dist/` |
| `npm start` | Démarre la version compilée |
| `npm run db:migrate` | Applique `sql/schema.sql` (script rejouable) |
| `npm run db:seed` | Insère les données de démonstration (idempotent) |
| `npm run db:reset` | Enchaîne migrate puis seed |
| `docker compose up -d` | Démarre la base |
| `docker compose logs -f postgres` | Suit les logs de la base |
| `docker compose down` | Arrête la base en gardant les données |
| `docker compose down -v` | Arrête et **supprime** le volume — remise à zéro totale |

Réinstallation complète depuis zéro :

```bash
docker compose down -v && docker compose up -d && npm run db:reset
```

---

## Variables d'environnement

Toutes documentées dans `.env.example`. Le fichier `.env` n'est **jamais** versionné.

### Conflit de port sur votre poste

`PGPORT` et `POSTGRES_HOST_PORT` valent 5433 par défaut, et doivent **toujours rester égaux**.

Si 5433 est déjà occupé sur votre machine — une installation PostgreSQL locale, par
exemple — changez les deux valeurs dans votre `.env` (5434 fonctionne) puis relancez :

```bash
docker compose down && docker compose up -d --force-recreate
```

Deux variables distinctes plutôt qu'une seule : `PGPORT` est un nom réservé par libpq
et se retrouve souvent déjà posé comme variable système par un installeur PostgreSQL.
Docker Compose lit l'environnement du shell **en priorité** sur le `.env`, le port
publié serait alors impossible à redéfinir. Pour la même raison, `dotenv` est
configuré avec `override: true` : le `.env` du projet prime toujours.

---

## Comptes de test

Créés par `npm run db:seed`.

| Rôle | Email | Mot de passe | État |
|---|---|---|---|
| Administrateur | `admin@examhub.local` | `Admin123!` | actif |
| Étudiant | `andry@examhub.local` | `Etudiant123!` | actif |
| Étudiant | `miora@examhub.local` | `Etudiant123!` | actif |
| Étudiant | `tiana@examhub.local` | `Etudiant123!` | **désactivé** (démontre RG-11) |

Données de démonstration : 2 cours, 2 examens (un **ouvert**, un **fermé** — démontre
RG-03), 5 questions et leurs choix.

---

## Architecture en couches

```
src/
├── Controller/    lit la requête, appelle le service, renvoie la réponse
├── Service/       règles de gestion — aucune requête SQL ici
├── Repositorie/   uniquement du SQL paramétré
├── Model/         types TypeScript des entités
├── Security/      JWT, hachage, guards, HttpError
├── middlewares/   errorHandler, asyncHandler
├── config/        lecture et validation des variables d'environnement
├── db/            pool pg, migrate, seed
├── routes/        déclaration des routes, une verticale par fichier
├── app.ts         assemblage Express
└── server.ts      démarrage
```

Trois règles vérifiées en relecture de PR :

- aucun `pool.query` en dehors de `Repositorie/`
- aucun objet `req` ou `res` en dehors de `Controller/`
- aucune règle de gestion en dehors de `Service/`

> **`Repositorie/` s'écrit bien ainsi.** C'est l'orthographe du sujet, elle est
> reprise telle quelle. Ne la « corrigez » pas en `Repository/` : vous casseriez
> les imports de tout le monde.

---

## Format d'erreur (RG-13)

Toutes les erreurs de l'API, sans exception, sortent sous cette forme :

```json
{ "message": "Cet examen n'est pas ouvert." }
```

Ne construisez jamais une réponse d'erreur à la main : levez une `HttpError`,
le middleware `errorHandler` s'occupe du reste.

```ts
throw new HttpError(409, "Vous avez deja passe cet examen.");
throw HttpError.notFound("Examen introuvable.");
```

| Code | Signification | Exemple dans ce projet |
|---|---|---|
| 400 | Données invalides | Question à 7 choix, points négatifs |
| 401 | Non authentifié | Token absent, expiré ou invalide |
| 403 | Non autorisé | Étudiant appelant `/api/courses` |
| 404 | Introuvable | Examen inexistant |
| 409 | Conflit | Deuxième tentative (RG-02), suppression RG-09 |

---

## Routes

Chaque verticale remplit **son seul fichier** dans `src/routes/`. Les sept routers
sont déjà montés dans `app.ts` : personne n'a besoin de modifier ce fichier partagé.

| Fichier | Préfixe | Propriétaire |
|---|---|---|
| `auth.ts` | `/api/auth` | P2 |
| `students.ts` | `/api/students` | P2 |
| `courses.ts` | `/api/courses` | P3 |
| `exams.ts` | `/api/exams` | P3 |
| `examQuestions.ts` | `/api/exams/:id/questions`, `/api/exams/:id/results` | P4 |
| `questions.ts` | `/api/questions` | P4 |
| `my.ts` | `/api/my` | P5 |

---

## Base de données

Sept tables, chaque contrainte portant une règle de gestion est annotée `RG-xx`
directement dans `sql/schema.sql`.

Règles garanties **en base**, vérifiées :

| Règle | Garantie SQL |
|---|---|
| RG-01 | `users_email_unique` |
| RG-02 | `attempts_une_par_etudiant UNIQUE (exam_id, student_id)` |
| RG-03 | `exams_fenetre_valide CHECK (ends_at > starts_at)` |
| RG-04 | `one_correct_choice_per_question` + `questions_points_positifs` |
| RG-05 | `answers.choice_id` nullable |
| RG-09 | `ON DELETE RESTRICT` sur `exams.course_id` et `attempts.exam_id` |
| RG-10 | `ON DELETE RESTRICT` sur `attempts.student_id` |

RG-04 n'est couverte qu'à moitié par SQL : « au moins une bonne réponse » et
« entre 2 et 6 choix » ne sont pas exprimables par une contrainte et restent
validées dans `Service/`.

### Fuseaux horaires

`starts_at` et `ends_at` sont des `TIMESTAMPTZ`, donc stockés en **UTC**. L'API reçoit
et renvoie de l'ISO 8601 en UTC. La conversion vers l'heure locale se fait uniquement
à l'affichage. Le conteneur est lui-même en UTC.

---

## Travail en équipe

- Aucun push direct sur `main` ni sur `develop` — tout passe par une Pull Request
- Une tâche = une branche = une PR, branche créée depuis `develop`
- Format de branche : `type/perimetre-description-courte`
- Format de commit : `type(scope): description à l'infinitif, en minuscule, sans point final`
- On ne modifie jamais un fichier hors de son périmètre sans l'accord de son propriétaire
- Resynchronisation quotidienne : `git checkout develop && git pull && git checkout ma-branche && git rebase develop`
