#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd -- "$root"
action=${1:-help}
if [[ $# -gt 0 ]]; then shift; fi
runtime=${AUREA_RUNTIME:-}
if [[ -z "$runtime" ]]; then
  if command -v bun >/dev/null 2>&1; then runtime=bun; else runtime=node; fi
fi
case "$runtime" in bun|node) ;; *) printf 'AUREA_RUNTIME debe ser bun o node\n' >&2; exit 2 ;; esac
case "$action" in
  check) exec "$runtime" tools/check.mjs "$@" ;;
  version) exec "$runtime" tools/version.mjs "$@" ;;
  build) exec "$runtime" tools/build.mjs "$@" ;;
  install) exec "$runtime" tools/install.mjs "$@" ;;
  help|--help|-h) printf 'Aurea 27: check | version | build | install RUTA [--apply | --check] [--component=NOMBRE]\n' ;;
  *) printf 'Acción desconocida: %s. Usa ./aurea.sh help\n' "$action" >&2; exit 2 ;;
esac
