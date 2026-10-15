# Atelier 404

Site vitrine d'une agence web créative (fictive) + [Undercover](#undercover), un mini-jeu de bluff multijoueur en temps réel, + [Kahoot](#kahoot), un module de quiz maison, le tout dans une seule app Next.js.

Documentation complète (architecture, données, animations, 3D, accessibilité, le jeu en détail) : **[TECHNICAL.md](./TECHNICAL.md)**.

## Stack

Next.js 16 (App Router) · React 19.2 · TypeScript · SCSS · GSAP + ScrollTrigger · Three.js / React Three Fiber.

## Démarrer en local

```bash
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

## Build de production

```bash
npm run build
npm start
```

`npm start` (et non un export statique) est nécessaire : le mini-jeu Undercover a une route API avec état serveur (voir [TECHNICAL.md §9](./TECHNICAL.md#9-undercover-mini-jeu-multijoueur)).

## Déploiement avec Docker / Dokploy

```bash
docker build -t atelier404 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr \
  .
docker run -p 3000:3000 atelier404
```

En production, l'image est construite par GitHub Actions à chaque push sur `main`, poussée sur GHCR, puis
Dokploy la télécharge (le serveur ne build jamais : il n'a pas assez de mémoire). `docker-compose.yml` ne fait que
télécharger l'image ; pour la construire en local avec compose :

```bash
NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

Détails, variables d'environnement (build vs runtime), et **pourquoi un seul réplica** : [TECHNICAL.md §12](./TECHNICAL.md#12-docker--dokploy).

## Undercover

Un mot secret, des imposteurs, un vote. Dès 3 joueurs, sans limite, chacun sur son téléphone.
Accessible depuis le site sur `/undercover`. Détails techniques (moteur de jeu, confidentialité, temps réel via SSE) : [TECHNICAL.md §9](./TECHNICAL.md#9-undercover-mini-jeu-multijoueur).

## Kahoot

Des quiz maison : QCM, curseurs de précision, cartes interactives à pointer du doigt. Accessible sur `/kahoot`
(jouer) ; la création/modification vit derrière une URL secrète (`KAHOOT_EDITOR_SLUG`, à définir en production —
voir [TECHNICAL.md §13](./TECHNICAL.md#13-kahoot-quiz-manuel)), pas de compte. Données persistées en JSON
(`data/kahoot/`, à monter en volume en production).

## Commandes utiles

```bash
npm run lint
npx tsc --noEmit
npm run test:undercover -- http://localhost:3000   # tests de bout en bout du jeu
```

## Licence

Projet fictif, réalisé dans un cadre pédagogique. Photos : Unsplash (licence libre). .
