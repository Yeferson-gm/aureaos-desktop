#!/usr/bin/env bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd -- "$root"
action=${1:-help}
if [[ $# -gt 0 ]]; then shift; fi
case "$action" in
  check) exec node tools/check.mjs "$@" ;;
  version) exec node tools/version.mjs "$@" ;;
  build) exec node tools/build.mjs "$@" ;;
  install) exec node tools/install.mjs "$@" ;;
  *) printf 'Aurea 27: check | version | build | install RUTA [--apply | --check]\n' ;;
esac
