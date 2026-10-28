#!/usr/bin/env bash
# Copies the PGlite runtime and pgvector extension into public/ so the static export can self-host them.
set -euo pipefail
D=public/pglite; S=node_modules/@electric-sql/pglite/dist
mkdir -p $D/vector
( cd $S && find . -type f ! -name '*.map' ! -name '*.tar.gz' ! -name '*.cjs' ! -name '*.d.ts' ! -name '*.d.cts' -print0 | xargs -0 -I{} sh -c 'mkdir -p "../../../../'$D'/$(dirname "{}")" && cp "{}" "../../../../'$D'/{}"' )
cp node_modules/@electric-sql/pglite-pgvector/dist/index.js node_modules/@electric-sql/pglite-pgvector/dist/vector.tar.gz $D/vector/
mkdir -p public/pdfjs && cp node_modules/pdfjs-dist/build/pdf.min.mjs node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdfjs/
