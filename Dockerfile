# syntax=docker/dockerfile:1

# Image optimisée pour Atelier 404 (site + jeu Undercover).
# Build multi-étapes : seul le résultat de `output: 'standalone'` (voir next.config.ts)
# finit dans l'image finale — pas de code source, pas d'outils de build, pas de
# dépendances de développement. Image finale ~150-200 Mo (Alpine + Node + le strict
# nécessaire), utilisateur non-root.
#
# Variables d'environnement :
#   - Celles préfixées NEXT_PUBLIC_ doivent être fournies comme BUILD ARGS (elles sont
#     figées dans les fichiers générés à la compilation, illisibles ensuite) :
#       NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_BASE_PATH, NEXT_PUBLIC_FORM_ENDPOINT
#   - PORT / HOSTNAME peuvent rester des variables d'environnement au lancement du
#     conteneur (lues par server.js au démarrage, pas figées au build).
#
# ⚠️ Le mini-jeu Undercover garde son état en mémoire, dans le processus. Ne jamais
# lancer plusieurs réplicas de ce service (voir TECHNICAL.md §9 et §12).

ARG NODE_VERSION=24-alpine

# ——— 1. deps : dépendances de PRODUCTION uniquement, mises en cache tant que le
#    lockfile ne change pas (l'étape la plus lente, mais la plus stable entre deux builds) ———
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
# Requis par plusieurs paquets natifs (dont sharp) sur Alpine (musl vs glibc).
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ——— 2. builder : dépendances complètes + code source → build Next.js ———
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .

ARG NEXT_PUBLIC_SITE_URL=https://atelier404.fr
ARG NEXT_PUBLIC_BASE_PATH=
ARG NEXT_PUBLIC_FORM_ENDPOINT=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_FORM_ENDPOINT=$NEXT_PUBLIC_FORM_ENDPOINT \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ——— 3. runner : image finale minimale, non-root ———
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# L'image officielle node:alpine fournit déjà un utilisateur non-root "node" (uid 1000).
# `deps` n'est utile que pour bénéficier du cache Docker sur ses propres calques ; le
# contenu réellement copié dans l'image finale vient de `builder` (sortie standalone).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+(process.env.NEXT_PUBLIC_BASE_PATH||'/')).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
