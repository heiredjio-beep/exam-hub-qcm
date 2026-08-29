## Ce que fait cette PR

<!-- Une phrase. Exemple : ajoute le CRUD complet des cours (routes, service, repository). -->

## Regles de gestion couvertes

<!-- Exemple : RG-09 - suppression refusee en 409 si le cours contient des examens -->

## Comment tester

<!--
Donnez les commandes exactes, pas une description vague.
Exemple :
1. docker compose up -d && npm run db:reset && npm run dev
2. POST /api/courses avec { "code": "PROG2", "name": "Programmation 2" }
3. Creer un examen sur ce cours, puis DELETE /api/courses/1 -> attendu 409
-->

## Points d'attention pour le relecteur

<!-- Ce qui merite un second regard : un choix discutable, un cas limite, une dependance. -->

---

## Checklist auteur

Cochez seulement ce que vous avez reellement verifie.

**Avant tout**

- [ ] La PR cible `develop`, pas `main`
- [ ] La branche part de `develop` a jour et a ete rebasee ce matin
- [ ] Le nom de branche suit `type/perimetre-description-courte`

**Perimetre**

- [ ] Je n'ai modifie que des fichiers qui m'appartiennent
- [ ] Je n'ai pas touche a `src/app.ts` ni a `src/App.jsx` : mes routes y sont deja montees
- [ ] Je n'ai pas recree un fichier qui existe deja ailleurs dans le depot
- [ ] Si j'avais besoin d'un fichier appartenant a quelqu'un d'autre, je lui ai demande avant

**Code**

- [ ] Le projet compile et demarre (`npm run build` puis `npm run dev`)
- [ ] Toutes les requetes SQL sont parametrees (`$1`, `$2`), aucune concatenation
- [ ] Aucun `pool.query` hors de `Repositorie/`
- [ ] Aucun `req` ni `res` hors de `Controller/`
- [ ] Aucune regle de gestion hors de `Service/`
- [ ] Toutes les erreurs passent par `HttpError`, format RG-13 respecte
- [ ] Aucune reponse ne contient `password_hash`, ni `is_correct` avant soumission

**Depot**

- [ ] `git diff` ne montre aucun marqueur de conflit (`<<<<<<<`, `=======`, `>>>>>>>`)
- [ ] Aucun secret, aucun `.env`, aucun `node_modules/`, aucun `dist/`
- [ ] Mes commits sont decoupes par idee, pas en un seul bloc
- [ ] Mes messages suivent `type(scope): description a l'infinitif, sans point final`
