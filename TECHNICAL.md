# Atelier 404 — documentation technique

Site vitrine d'une agence web fictive + un mini-jeu multijoueur (Undercover) + un module de quiz (Kahoot).
Stack : **Next.js 16 (App Router)**, React 19.2, TypeScript, SCSS, GSAP + ScrollTrigger, Three.js / React Three Fiber.

> ⚠️ Next 16 diffère des versions précédentes : en cas de doute, lire `node_modules/next/dist/docs/` (voir `AGENTS.md`).
> React est volontairement fixé en 19.2 (`~19.2`) : React Three Fiber 9.7 exige React < 19.3.

## Sommaire

1. [Pourquoi Next.js, et l'approche Jamstack](#1-pourquoi-nextjs-et-lapproche-jamstack)
2. [Génération statique](#2-génération-statique)
3. [Organisation des données](#3-organisation-des-données)
4. [Modifier le contenu](#4-modifier-le-contenu)
5. [Animations](#5-animations)
6. [Éléments 3D](#6-éléments-3d)
7. [Accessibilité](#7-accessibilité)
8. [Performance](#8-performance)
9. [Undercover (mini-jeu multijoueur)](#9-undercover-mini-jeu-multijoueur)
10. [Commandes et tests](#10-commandes-et-tests)
11. [Déploiement (VPS, mise à jour)](#11-déploiement-vps-mise-à-jour)
12. [Docker / Dokploy](#12-docker--dokploy)
13. [Kahoot (quiz manuel)](#13-kahoot-quiz-manuel)

---

## 1. Pourquoi Next.js, et l'approche Jamstack

- **Server Components par défaut** : le contenu est rendu en HTML au build, sans JavaScript ; seuls les composants
  interactifs sont « client » (menu, curseur, transitions, formulaire, scènes 3D, jeu).
- **`next/image`, `next/font`, métadonnées, sitemap, robots** : les bases (perf + SEO) sont fournies.
- **Routage par fichiers** + `generateStaticParams()` : une page projet par entrée de données, sans code en plus.

Approche **Jamstack** : le site est du HTML/CSS/JS pré-rendu, servi tel quel (CDN possible), sans base de données,
sans CMS. Le contenu vit dans des fichiers TypeScript (`src/data/`). Le formulaire de contact est prêt pour un service
tiers (`NEXT_PUBLIC_FORM_ENDPOINT`). **Deux exceptions assumées** : le jeu Undercover, qui a besoin d'un état serveur
partagé (voir §9), et le module Kahoot, qui persiste des quiz créés à la main dans des fichiers JSON (voir §13) —
les seules parties dynamiques du projet.

## 2. Génération statique

- `next build` pré-rend chaque page (`○ Static`). Les 5 pages `/projets/[slug]` sont générées par
  `generateStaticParams()` (`src/app/projets/[slug]/page.tsx`) à partir de `src/data/projects.ts`, avec
  `dynamicParams = false` (un slug inconnu renvoie une 404).
- Les métadonnées de chaque projet sont produites par `generateMetadata()` depuis les mêmes données.
- Dynamiques (`ƒ`) : `/api/undercover`, `/api/undercover/stream` et `/undercover/[code]` (une room = une URL éphémère),
  ainsi que `/api/kahoot*`, `/kahoot`, `/kahoot/jouer/[id]` et l'éditeur secret (§13) — ces pages lisent des fichiers
  JSON à chaque requête (`dynamic = 'force-dynamic'`), donc jamais mises en cache statiquement.

## 3. Organisation des données

Tout ce qui peut changer est séparé des composants, dans `src/data/` :

| Fichier | Contenu |
| --- | --- |
| `site.ts` | nom, baseline, navigation, coordonnées fictives, réseaux sociaux, sujets du formulaire |
| `services.ts` | services + étapes de la méthode |
| `projects.ts` | projets (+ helpers `getProject`, `getNextProject`…) |
| `team.ts` | équipe (provisoire) + valeurs |
| `home.ts` | textes des pages (accueil, services, équipe, contact, projets) |
| `types.ts` | types partagés |
| `undercover/` | banque de mots du jeu (serveur uniquement, voir §9) |

Autres dossiers : `src/components/` (composants par domaine), `src/lib/` (utilitaires, moteur d'animation, logique du
jeu), `src/styles/` (SCSS).

## 4. Modifier le contenu

- **Ajouter un projet** : copier un objet dans `src/data/projects.ts`, changer `slug`, textes, images (placées dans
  `public/images/projets/`, dimensions renseignées) et `theme` (couleurs de fond/texte — vérifier le contraste AA).
  La page `/projets/<slug>` apparaît toute seule, ainsi que la carte de liste et le sitemap.
- **Modifier un membre de l'équipe** : `src/data/team.ts`. Passer `placeholder: false` retire le repère
  « profil provisoire ».
- **Modifier un service** : `src/data/services.ts` (`accent` = couleur de la bande).
- **Coordonnées** : `src/data/site.ts` (`contact`). Le lien « Undercover » du pied de page est dans
  `src/components/layout/Footer.tsx` (il remplace l'ancien lien Mastodon).
- **Formulaire de contact** : renseigner `NEXT_PUBLIC_FORM_ENDPOINT` (Formspree, Getform…) ; sans cela l'envoi est
  simulé (`src/lib/submitContact.ts`).

## 5. Animations

- **Un seul moteur déclaratif** (`src/lib/motion/`) piloté par attributs HTML :
  `data-reveal="fade|words|scrub|stagger|pop|mask"`, `data-speed` (parallaxe), `data-drift`.
  `MotionProvider` l'initialise à chaque page dans `gsap.matchMedia()`.
- Les états initiaux « masqués » sont en CSS sous `html.motion-ok` (classe posée par un script inline **uniquement
  si le mouvement est autorisé**) + filet de sécurité de 4 s si le JS ne démarre pas.
- **Transitions de page** : rideau coloré (`PageTransition.tsx`, `TLink`) ; la couleur et le libellé viennent de
  `src/lib/routes.ts`.
- **CSS pour le simple** : hovers, texte « roulant », bandeau défilant, autocollants.
- **`prefers-reduced-motion`** : `gsap.matchMedia()` désactive toute animation JS, le CSS neutralise
  transitions/animations (`_accessibility.scss`), curseur, parallaxe et 3D animée sont coupés ; le contenu reste
  toujours accessible.
- Le jeu utilise le même langage (`components/undercover/useEnter.ts`) sans passer par `data-reveal`
  (contenu monté dynamiquement).

## 6. Éléments 3D

Objets **originaux**, construits en primitives Three.js (aucun modèle externe) dans `src/components/three/` :
écran CRT (hero, page 404), disquette (index des services, prend la couleur du service survolé), souris à câble
(page contact, câble simulé par Verlet dans `Rope.ts`).

- `LazyStage` charge Three.js **uniquement à l'approche du viewport** (`next/dynamic`, `ssr: false`) et met le rendu
  en pause hors écran.
- Sans WebGL ou avec « mouvement réduit » : pose statique, ou rien (les scènes sont décoratives, `aria-hidden`).
- La logique impérative (texture canvas, câble) est isolée dans des classes (`CrtScreen.ts`, `Rope.ts`).

## 7. Accessibilité

- HTML sémantique, un `h1` par page, lien d'évitement, `main` focalisable après navigation.
- Focus visible partout (double anneau encre/papier, jaune sur fonds sombres), navigation clavier complète.
- Menu mobile : `aria-expanded`, `Échap`, focus piégé, `inert` quand fermé.
- Formulaires : labels, `aria-invalid`, `aria-describedby`, résumé d'erreurs focalisé, succès annoncé.
- Contrastes AA vérifiés pour chaque couple fond/texte ; l'information n'est jamais portée par la couleur seule.
- Aucune information uniquement accessible au survol ou par animation.
- Jeu : titre de phase focalisé à chaque changement, annonces `aria-live`, radios natifs, états textuels
  (« a voté », « est prêt »…), secrets absents du DOM tant que la carte n'est pas retournée.

## 8. Performance

- Pages pré-rendues, Server Components par défaut, peu de bibliothèques (GSAP, Three/R3F).
- Images locales optimisées par `next/image` (AVIF/WebP, `sizes`, lazy).
- Three.js chargé à la demande ; boucle de rendu suspendue hors écran ; `dpr` plafonné à 1,5.
- Les styles du jeu (`styles/undercover/`) ne sont chargés que sur `/undercover*` (import dans
  `app/undercover/layout.tsx`).
- Le jeu n'ajoute aucune dépendance : SSE natif, `fetch`, `crypto` Node.

---

## 9. Undercover (mini-jeu multijoueur)

Accès : `/undercover` (créer / rejoindre) et `/undercover/[code]` (la partie). Lien dans le pied de page.

### Choix technique du temps réel

**Route Handlers Next.js + Server-Sent Events (SSE) + état en mémoire.**

| Besoin | Solution |
| --- | --- |
| Client → serveur | `POST /api/undercover` (créer, rejoindre, consulter, actions) |
| Serveur → clients | `GET /api/undercover/stream` : flux SSE, **une vue personnalisée par joueur** |
| État | `Map` de rooms en mémoire, ancrée sur `globalThis` (`lib/undercover/store.ts`) |
| Reconnexion | `EventSource` se reconnecte seul ; la session (id + jeton) est dans `localStorage` |

Pourquoi : aucune dépendance, aucun compte/service externe, aucun processus supplémentaire, latence faible, et un
flux **unidirectionnel** suffisant (les actions sont des POST). Un WebSocket, Socket.IO ou un service (Ably,
PartyKit…) n'apporteraient rien ici que de la complexité.

**Limite assumée** : l'état vit dans **un seul processus Node** (`next start`). Ça ne convient pas au serverless
(Vercel) ni à plusieurs instances derrière un répartiteur. Pour passer à l'échelle, remplacer `store.ts` (même API :
`createRoomForHost`, `joinRoom`, `peekRoom`, `runAction`, `subscribe`) par une version adossée à Redis + pub/sub ;
le moteur (`engine.ts`) et les vues (`view.ts`) ne changent pas. Les rooms disparaissent si le serveur redémarre
(l'écran indique alors « Room introuvable »).

### Organisation

```text
src/data/undercover/      banque de mots (21 thèmes × ~30-35 paires), SERVEUR UNIQUEMENT
src/lib/undercover/
  types.ts                types : partagés / serveur (Room, GameData) / publics (RoomView)
  rules.ts                constantes, composition valide, normalisation, délais de présence
  scoring.ts              barème des scores (SCORE_TABLE, modifiable sans toucher au moteur)
  engine.ts               machine à états pure (aucun réseau ni timer)
  view.ts                 projection publique / privée (liste blanche)
  parse.ts                validation des entrées réseau
  store.ts                rooms, SSE, présence, transfert de host, nettoyage
  client.ts               hook `useRoom` (navigateur)
src/app/api/undercover/   route.ts (POST) + stream/route.ts (SSE)
src/components/undercover Lobby, RoleReveal, Clues, Voting, VoteResult, Elimination, GameOver…
src/styles/undercover/    styles du jeu
scripts/                  undercover-e2e.mjs (tests), undercover-bots.mjs (bots pour test manuel)
```

### Machine à états

```text
LOBBY → REVEAL → CLUES → VOTING → RESULT → ELIMINATION → CLUES … ou GAME_OVER
                            ↑          │ égalité
                            └──────────┘ re-vote entre les ex æquo
GAME_OVER → LOBBY (nouvelle manche : room, joueurs et scores conservés)
```

Toutes les transitions sont décidées **par le serveur** et diffusées à tous ; le client ne calcule rien de
« vrai ». `reconcile()` fait avancer la phase dès que tous les joueurs **présents** ont agi (aucun blocage si
quelqu'un est absent) — **sauf CLUES → VOTING**, volontairement manuelle : une fois le dernier indice donné, la
partie reste en CLUES (discussion libre) jusqu'à ce que le host envoie l'action `startVote`.

- **Composition** : au moins 3 joueurs (10 max) ; au moins un imposteur ; au moins 2 civils ; civils strictement plus
  nombreux que les imposteurs. Toute demande incohérente est corrigée : le compteur modifié par le host est conservé,
  l'autre s'ajuste.
- **Vote** : contre un joueur, ou « Passer » (`SKIP_VOTE` dans `rules.ts`) pour n'éliminer personne ce tour-ci —
  compte comme un vote normal dans le dépouillement, jamais comme cible éligible à l'élimination.
- **Égalité** : re-vote restreint aux ex æquo (« Passer » reste toujours proposable) ; jusqu'à 3 votes ; si
  l'égalité persiste, aucune élimination et nouveau tour d'indices ; 3 tours sans élimination → victoire des
  imposteurs (un vote « Passer » majoritaire compte comme une absence d'élimination, donc alimente ce compteur).
- **Victoire** : les Civils gagnent quand tous les imposteurs sont éliminés ; les imposteurs gagnent quand les civils
  ne sont plus strictement plus nombreux qu'eux ; Mr White éliminé peut deviner le mot (insensible à la casse, aux
  accents et à la ponctuation) et gagne s'il le trouve.
- **Scores** : `src/lib/undercover/scoring.ts` (Civil gagnant 2, Undercover gagnant 10, Mr White gagnant 6).
- **Indices des tours précédents** : au sein d'une même manche, `game.clueHistory` garde les indices des tours
  déjà joués (remis à zéro à chaque nouvelle manche, avec `game.clues`) — déjà publics au moment où ils ont été
  donnés, donc sans risque à republier. Affiché, repliable, **uniquement pendant le vote** (pas pendant les
  indices, où seul le tour en cours compte) : `components/undercover/parts.tsx` → `ClueHistory`.

### Confidentialité

- Rôles et mots ne sont **jamais** dans l'état public : `view.ts` construit chaque vue par liste blanche.
  Un joueur reçoit uniquement **son** rôle et **son** mot ; le rôle d'un éliminé devient public à son élimination ;
  tout est révélé en fin de manche.
- Les votes en cours restent secrets (le public voit seulement « a voté ») ; les bulletins sont publiés au
  dépouillement.
- La banque de mots n'est jamais importée côté client : la page serveur ne passe au client que la liste des thèmes
  **sans** leurs paires (`themeInfos`).
- Les jetons d'authentification ne sont jamais diffusés ; comparaison en temps constant.
- Le test `undercover-e2e.mjs` analyse **toutes** les vues brutes reçues par chaque joueur pour vérifier qu'aucun secret
  d'autrui n'y figure.

### Présence et déconnexions

| Cas | Comportement |
| --- | --- |
| Rechargement | le jeton en `localStorage` rétablit le joueur (rôle, mot, place) |
| Coupure réseau | `EventSource` se reconnecte ; le joueur apparaît « Reconnexion… » |
| Déconnecté > 30 s | marqué « Absent » : il ne bloque plus ready / indices / vote |
| Lobby, déconnecté > 30 s | retiré de la room |
| Host déconnecté > 15 s, ou qui quitte | rôle de host transféré à un joueur connecté |
| Joueur qui quitte en cours de partie | éliminé (rôle révélé), victoire vérifiée immédiatement |
| Arrivée tardive | refusée avec un message clair (retour possible à la manche suivante) |
| Room vide 10 min / âgée de 8 h | supprimée |

Le host dispose d'un bouton de secours (« Passer le tour », « Clôturer le vote »…) pour débloquer une phase.

### Ajouter un thème de mots

Créer `src/data/undercover/mon-theme.ts` :

```ts
import { defineTheme } from './define';
export const monTheme = defineTheme('mon-theme', 'Mon thème', '🎯', [
  ['Mot civil', 'Mot undercover'],
  // …
]);
```

puis l'ajouter au tableau `themes` de `src/data/undercover/index.ts`. Le sélecteur du lobby se met à jour seul.

### Sécurité / robustesse

Entrées validées (`parse.ts`), corps limité à 4 Ko, noms de 2 à 16 caractères, 10 joueurs et 300 rooms maximum,
codes de room sans caractères ambigus. Pas de limitation de débit par IP : à ajouter derrière un reverse proxy si le
jeu est exposé publiquement.

---

## 10. Commandes et tests

```bash
npm run dev          # développement
npm run build        # build de production
npm start            # serveur de production (nécessaire pour le jeu : état en mémoire)
npm run lint
npx tsc --noEmit

# Tests de bout en bout du multijoueur (clients HTTP + SSE réels) — serveur lancé au préalable
npm run test:undercover -- http://localhost:3000            # ~5 s
npm run test:undercover -- http://localhost:3000 --slow     # + présence / absence / host (~45 s)

# Jouer à la main avec des bots (dans un terminal), puis un navigateur pour l'humain
BASE=http://localhost:3000 node scripts/undercover-bots.mjs join CODE 4
BASE=http://localhost:3000 node scripts/undercover-bots.mjs step [--vote Prénom]
```

Variables d'environnement : voir `.env.example` (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FORM_ENDPOINT`,
`NEXT_PUBLIC_BASE_PATH`). Les photos viennent d'Unsplash (licence libre) ; les données du site (agence, projets,
équipe, coordonnées) sont fictives.

## 11. Déploiement (VPS, mise à jour)

Le site utilise `output: 'standalone'` (voir `next.config.ts`) : `next build` produit un serveur Node autonome
(`.next/standalone/`), à copier tel quel sur le serveur — pas besoin d'y installer les dépendances de développement
ni de refaire le build sur place. Si le site est déployé sous un sous-chemin (ex. `/atelier404`), `basePath` doit
être fourni **au build** (la valeur est figée dans les fichiers générés, y compris côté serveur) via
`NEXT_PUBLIC_BASE_PATH` — voir `src/lib/basePath.ts` pour la liste des endroits qui en dépendent (le routing de
Next.js gère `next/link`/`next/image` tout seul, mais pas les `fetch()`/`EventSource()` écrits à la main comme dans
le jeu, ni les URLs construites pour `sitemap.ts`/`robots.ts`).

### Reconstituer le paquet à déployer

```bash
./scripts/package-deploy.sh
# ou, pour un sous-chemin :
NEXT_PUBLIC_BASE_PATH=/atelier404 NEXT_PUBLIC_SITE_URL=https://mondomaine.fr ./scripts/package-deploy.sh
```

Produit un dossier `deploy/` (~30 Mo : `server.js`, `node_modules`, `.next`, `public`) à transférer sur le serveur
(remplace tout, ne fusionne pas — les noms de fichiers générés changent à chaque build). Sous Git Bash (Windows),
un chemin comme `/atelier404` passé en variable d'environnement se fait parfois « corriger » en chemin Windows par
le shell ; le script neutralise ça lui-même (`MSYS_NO_PATHCONV`).

### Sur le serveur

```bash
sudo systemctl stop atelier404          # nom du service, à adapter
# transférer le CONTENU de deploy/ par-dessus l'ancien déploiement (remplace tout)
sudo systemctl start atelier404
sudo systemctl status atelier404
curl -I http://127.0.0.1:PORT/          # (+ le sous-chemin éventuel)
```

Le service tourne en un seul processus (`Restart=always` via systemd) — cohérent avec le store en mémoire
d'Undercover (§9), qui ne supporte de toute façon qu'une seule instance. La configuration Apache/Nginx en reverse
proxy n'a besoin d'être retouchée que si le port, le domaine ou le sous-chemin changent — pas pour une mise à jour
de contenu ou de code.

## 12. Docker / Dokploy

Le dépôt contient un `Dockerfile` multi-étapes et un `docker-compose.yml`, pensés pour un déploiement
[Dokploy](https://dokploy.com) (ou tout hôte Docker classique).

### Construction de l'image

Trois étapes (`deps` → `builder` → `runner`) :

1. **`deps`** installe uniquement les dépendances de production (`npm ci --omit=dev`), dans son propre calque —
   sert surtout à garder un cache Docker stable, indépendant du code source.
2. **`builder`** installe toutes les dépendances, copie le code, lance `next build`. C'est cette étape qui produit
   `.next/standalone` (voir §2 et `next.config.ts` → `output: 'standalone'`).
3. **`runner`** repart d'une image Alpine neuve et ne copie que le résultat du build : `server.js`,
   `.next/standalone` (node_modules déjà réduit à l'essentiel), `.next/static`, `public`. Aucun outil de build, aucune
   dépendance de développement, aucun code source TypeScript dans l'image finale. Utilisateur non-root (`node`,
   fourni par l'image officielle).

Résultat : une image de l'ordre de 150-200 Mo, contre plusieurs centaines de Mo pour une image Node « naïve »
(`COPY . .` + `npm install` + `npm run build` dans une seule étape, avec `node_modules` complet et le cache de
build encore présents).

`sharp` (optimisation d'image de `next/image`) est un vrai dépendant de Next.js dans ce projet (`npm ls sharp`
le montre sous `next`) : son binaire natif suit donc normalement le traçage automatique de `output: 'standalone'`.
Par sécurité — c'est la recommandation officielle de Next.js pour l'auto-hébergement — `next.config.ts` force son
inclusion explicite via `outputFileTracingIncludes`.

### Variables d'environnement : build vs runtime

| Variable | Quand | Pourquoi |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Build** (`--build-arg` / `build.args`) | Figée dans les fichiers générés (sitemap, Open Graph…) |
| `NEXT_PUBLIC_BASE_PATH` | **Build** | Idem — voir `src/lib/basePath.ts` |
| `NEXT_PUBLIC_FORM_ENDPOINT` | **Build** | Idem — inlinée dans le bundle client |
| `PORT`, `HOSTNAME` | Runtime (`environment:` / variables du conteneur) | Lues par `server.js` au démarrage |

Toute variable `NEXT_PUBLIC_*` doit passer par `ARG`/`--build-arg`, jamais par les variables d'environnement du
conteneur au lancement : à ce moment-là, le JavaScript est déjà compilé, la modifier n'aurait aucun effet.

### Sur Dokploy

1. Nouvelle application → type **Docker Compose**, pointer sur ce dépôt (`docker-compose.yml` à la racine).
2. Renseigner `NEXT_PUBLIC_SITE_URL` (et `NEXT_PUBLIC_BASE_PATH` si le site ne vit pas à la racine du domaine)
   dans les variables d'environnement du build, côté interface Dokploy — elles sont lues par `docker-compose.yml`
   via `${NEXT_PUBLIC_SITE_URL:-...}`.
3. Attacher un domaine sur le port interne **3000** (celui exposé par le conteneur).
4. **Un seul réplica.** Ne jamais activer de scaling horizontal sur ce service : le mini-jeu Undercover garde
   l'état des parties en mémoire dans le processus (§9) — plusieurs instances ne partageraient pas les rooms, et
   des joueurs dans la même partie pourraient atterrir sur des conteneurs différents.
5. Un `HEALTHCHECK` est défini dans le `Dockerfile` (requête sur la page d'accueil) : Dokploy peut s'en servir
   pour détecter un conteneur qui ne répond plus.

### Construire et tester en local

```bash
docker build -t atelier404 --build-arg NEXT_PUBLIC_SITE_URL=https://mondomaine.fr .
docker run -p 3000:3000 atelier404
# ou :
NEXT_PUBLIC_SITE_URL=https://mondomaine.fr docker compose up --build
```

## 13. Kahoot (quiz manuel)

Accès public : `/kahoot` (liste « Mes Kahoot » + onglet « Actualités »), `/kahoot/jouer/[id]` (jouer). Lien dans le
pied de page, juste sous Undercover. **Cette étape ne couvre que la création manuelle** — l'onglet « Actualités »
(génération automatique depuis l'actu via NewsAPI + Claude) est une vitrine « Bientôt disponible », volontairement
non implémentée : l'architecture (type `KahootKind = 'manual' | 'auto'`, dossier `data/kahoot/`) est prête à
accueillir un second dossier `data/kahoot/auto/` et sa propre route de génération sans toucher au module manuel.

### Où sont les données

Aucune base de données : un fichier JSON par Kahoot, écrit par `src/lib/kahoot/store.ts`.

```text
data/kahoot/manual/<id>.json     un Kahoot = un fichier (id = randomUUID())
```

Écriture atomique (fichier temporaire + `rename`, atomique côté OS) : jamais de fichier à moitié écrit si le
process s'arrête pendant une sauvegarde. Le dossier doit être un **volume monté** en production
(`docker-compose.yml` → `kahoot_data:/app/data`) : sans ce volume, les quiz créés après le déploiement disparaissent
au redéploiement suivant (le conteneur repart d'une image neuve). En local (`npm run dev`), le dossier est créé tout
seul au premier enregistrement.

### Organisation

```text
src/lib/kahoot/
  types.ts       Kahoot, Question (QCM / curseur / carte), résumés de liste
  rules.ts       limites (titre, nombre de questions, temps max 60 s, points…)
  validate.ts    validation stricte des requêtes entrantes (même logique que undercover/parse.ts)
  scoring.ts     fonctions pures de score (QCM, curseur, distance carte — voir « Score » plus bas)
  store.ts       lecture/écriture des fichiers JSON, écriture atomique
  editorSlug.ts  segment secret de l'éditeur + vérification de la clé (voir plus bas)
  client.ts      appels fetch côté navigateur vers /api/kahoot*
src/app/api/kahoot/
  route.ts               GET (liste) / POST (création, protégée)
  [id]/route.ts           GET (un quiz) / PUT (modification, protégée) / DELETE (protégée)
  [id]/duplicate/route.ts POST (duplication, protégée)
src/app/kahoot/
  page.tsx                 page publique (onglets)
  jouer/[id]/page.tsx       jouer (public)
  [secret]/page.tsx         tableau de bord (Modifier / Dupliquer / Supprimer) — voir plus bas
  [secret]/nouveau/page.tsx éditeur, création
  [secret]/[id]/page.tsx    éditeur, modification
src/components/kahoot/     cartes, onglets publics, éditeur (question par question, drag & drop),
                            lecteur de partie (timer, correction, score), carte Leaflet
src/styles/kahoot/         styles du module (chargés uniquement sous /kahoot)
```

### L'éditeur : une URL secrète, pas un compte

Pas de compte, pas d'authentification : l'énoncé est explicite là-dessus. La création/modification/suppression vit
derrière un segment d'URL non deviné plutôt qu'un vrai système d'auth (`/kahoot/<secret>`), lu via la variable
d'environnement **`KAHOOT_EDITOR_SLUG`** (sans préfixe `NEXT_PUBLIC_`, volontairement : une variable préfixée
`NEXT_PUBLIC_` finit dans le bundle JavaScript envoyé au navigateur — donc lisible par n'importe qui via les
DevTools —, ce qui viderait la « confidentialité » de son sens). Le dépôt étant public sur GitHub, ne comptez pas sur
la valeur par défaut du code (`atelier-prive-9f3k2q`, utile seulement en développement local) : **définissez une
vraie valeur dans l'environnement de production** (`docker-compose.yml` / interface Dokploy), qu'il ne faut jamais
committer, exactement comme un mot de passe.

Les routes de mutation de l'API (`POST`/`PUT`/`DELETE` sous `/api/kahoot`) vérifient la même clé, envoyée par le
client dans l'en-tête `x-kahoot-key`, en temps constant (`timingSafeEqual`, même logique que les jetons
d'Undercover) : sans elle, `GET /api/kahoot` (lecture) reste public — nécessaire pour que la page `/kahoot` et le
mode « Jouer » fonctionnent sans configuration — mais aucune écriture n'est possible sans connaître le secret. Ce
n'est pas un « faux » système de sécurité complexe : c'est littéralement une comparaison de chaîne, appliquée aux
deux endroits (page et API) qui en ont besoin.

La page de l'éditeur porte `robots: { index: false, follow: false }` et n'apparaît ni dans `sitemap.ts`, ni dans le
pied de page, ni dans la page publique `/kahoot` — mais volontairement **pas** dans `robots.txt` non plus (un
`Disallow` y afficherait l'adresse en clair à quiconque le lit).

### Éditeur : types de question

Trois types (`src/lib/kahoot/types.ts`), un quatrième volontairement absent :

| Type | Description | Remarque |
| --- | --- | --- |
| `multiple_choice` | QCM, 2 à 6 propositions, une ou plusieurs bonnes réponses | |
| `slider` | curseur numérique (min/max/pas/valeur correcte/unité) | |
| `map_pin` | carte interactive (Leaflet + tuiles OpenStreetMap), latitude/longitude, précision et zone acceptable en km | |
| *« placement »* | — | non implémenté : l'énoncé demande explicitement d'éviter un doublon avec le curseur si l'interaction n'est pas réellement différente — c'est le cas ici, `slider` couvre déjà « placer un curseur sur une échelle » |

Chaque question partage : texte, temps limite (5 à 60 s), points, explication, source (nom + URL), image (URL
externe uniquement — pas d'upload, comme demandé). Tout est revalidé côté serveur (`validate.ts`) : longueurs,
bornes numériques, cohérence min/max/valeur correcte, latitude/longitude dans les plages valides, URL strictement
`http(s):` (jamais `javascript:`/`data:`, puisque ces URLs sont réinjectées telles quelles dans `src`/`href`).

Réordonnancement des questions : glisser-déposer natif (`draggable`, aucune bibliothèque) **plus** des boutons
« Monter »/« Descendre » pour le clavier et les lecteurs d'écran — le drag & drop seul n'est pas accessible.

### Carte interactive

Seule vraie lacune du projet existant pour ce module : aucune solution de carte n'était en place. Choix ajouté :
**Leaflet** (léger, sans dépendance à un compte/clé API) + tuiles OpenStreetMap, plutôt qu'une carte du monde
dessinée à la main (imprécise pour calculer une distance) ou une bibliothèque plus lourde (Mapbox GL). Les marqueurs
sont redessinés en CSS (pastille encre + couleur d'accent, voir `.kh-map-pin` dans `styles/kahoot/main.scss`) plutôt
que l'icône Leaflet par défaut, pour rester dans le langage visuel du site malgré des tuiles forcément
« réalistes ». `MapPicker` n'est jamais importé statiquement : toujours via `next/dynamic({ ssr: false })`, Leaflet
ayant besoin de `window`/`document`.

### Score

`src/lib/kahoot/scoring.ts` : fonctions **pures** (aucun accès réseau ni DOM), pensées pour être rejouées côté
serveur si le mode multijoueur (préparé, pas implémenté) doit un jour valider les réponses sans faire confiance au
client. Principe commun : `points × précision × rapidité`, où la rapidité ne fait jamais perdre plus de la moitié
des points (facteur entre 0,5 et 1 selon le temps restant).

- **QCM** : toutes les bonnes réponses cochées, aucune de trop → 100 % de précision, sinon 0.
- **Curseur** : précision continue selon la distance à la valeur correcte, ramenée à l'étendue min/max (pas de
  seuil brutal — un curseur presque juste rapporte presque tous les points).
- **Carte** : distance orthodromique (`haversineKm`, formule de Haversine) entre le point posé et la bonne réponse ;
  précision continue jusqu'au rayon `precisionKm` (score plein), score nul au-delà de `toleranceKm` si défini.

### Mode local, préparation du multijoueur

Pas d'adversaire réseau pour l'instant (`PlayRunner`, entièrement côté client) : le Kahoot complet — bonnes réponses
comprises — est envoyé au navigateur qui joue, comme le vrai Kahoot le fait aussi une fois la question affichée.
Rien n'empêche d'ajouter plus tard un mode « room » : le score (`scoring.ts`), le modèle de données (`Kahoot`,
`Question`) et le stockage (`store.ts`) ne changeraient pas ; il faudrait ajouter un état de partie en mémoire et un
flux temps réel, sur le modèle exact d'Undercover (§9) — SSE, pas de nouvelle dépendance.

### Robustesse

Identifiants de fichier validés par une regex stricte avant toute construction de chemin (`isValidKahootId`) : un id
malformé ne peut jamais sortir de `data/kahoot/manual/`. Requêtes limitées à 200 Ko. Un fichier JSON corrompu ou
illisible est ignoré par `listKahoots()` plutôt que de faire planter la liste.
```
