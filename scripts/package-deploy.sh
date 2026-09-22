#!/usr/bin/env bash
# Build de production + reconstitution du dossier deploy/ prêt à transférer sur le serveur.
#
#   ./scripts/package-deploy.sh
#   NEXT_PUBLIC_BASE_PATH=/atelier404 NEXT_PUBLIC_SITE_URL=https://mondomaine.fr ./scripts/package-deploy.sh
#
# Sous Git Bash (Windows), le script neutralise lui-même le bug de conversion de chemin
# qui transforme "/atelier404" en un chemin Windows (MSYS_NO_PATHCONV).
#
# Résultat : le dossier deploy/ contient server.js, node_modules, .next (avec .next/static
# fusionné) et public — tout ce qu'il faut, rien de plus (~30 Mo). C'est SON CONTENU qu'il
# faut glisser dans le dossier du site sur le serveur (pas le dossier deploy/ lui-même).

set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Build (NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH:-<racine>}, NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL:-<défaut>})"
MSYS_NO_PATHCONV=1 npm run build

echo "→ Reconstitution de deploy/"
rm -rf deploy
mkdir -p deploy
cp -r .next/standalone/. deploy/
cp -r .next/static deploy/.next/static
cp -r public deploy/public

echo "→ Terminé : $(du -sh deploy | cut -f1) dans ./deploy"
echo "  Glissez le CONTENU de ce dossier (pas le dossier lui-même) sur le serveur,"
echo "  par-dessus l'ancien déploiement, puis redémarrez le service."
