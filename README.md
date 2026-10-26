# Aurea 27

Stack de escritorio para Fedora GNOME: tema completo, barra superior, dock,
islas, widgets, iconos del escritorio y fondo animado dentro y fuera del centro
de aplicaciones. Es una personalización independiente, no un producto de Apple.

## Estructura

```text
aurea-27/
├── theme/
│   ├── gtk/                 GTK 2/3/4, Shell y decoraciones
│   ├── gtk-overrides/       Personalización GTK4 activa
│   ├── icons/               Tema de iconos completo, incluidas carpetas cyan
│   ├── cursors/             Cursores
│   └── tools/              Verificación de recursos
├── extensions/
│   ├── topbar/
│   ├── dock/
│   ├── dynamic-island/
│   ├── app-island/
│   ├── widgets/
│   ├── live-wallpaper/
│   ├── desktop-icons/
│   └── app-center/
├── integrations/            Pruebas del escritorio y ajustes auxiliares
├── presets/                 Preferencias visuales sin datos personales
├── tools/                   Versión, construcción, instalación y validación
├── tests/                   Pruebas del repositorio
├── docs/                    Arquitectura, procedencia y notas técnicas
└── tasks/                   Plan y seguimiento de la consolidación
```

## Desarrollo

```bash
node tools/check.mjs
git status
git add RUTAS_MODIFICADAS
git commit -m "fix: describir el cambio"
```

No editar las copias instaladas: editar aquí, probar y generar una distribución.
Los cambios explicativos van en Markdown. Se conservan las licencias, avisos de
copyright, directivas interpretadas por herramientas y cadenas funcionales.
Los valores de versión de protocolos, formatos de datos, GTK y dependencias no
son la versión de Aurea y no deben reiniciarse.

## Distribuciones desde Git

Todos los componentes comparten una etiqueta semántica. El punto de partida es
`v0.0.1`; no hay constantes de versión del producto en los fuentes.

```bash
git tag -a v0.0.1 -m "Aurea 27: base inicial consolidada"
node tools/version.mjs
node tools/build.mjs
node tools/install.mjs dist/aurea-27-0.0.1
node tools/install.mjs dist/aurea-27-0.0.1 --apply
node tools/install.mjs dist/aurea-27-0.0.1 --check
```

La etiqueta inicial ya creada no se debe recrear ni mover. Para la siguiente
entrega, crear otra etiqueta tras probar y confirmar los cambios. La construcción
exige una etiqueta en HEAD y árbol limpio; `dist/` es generado y no entra en Git.
GNOME recibe `version-name` desde la etiqueta y un entero calculado; no se cambia
su formato de metadatos. La instalación migra los UUID de los tres forks de tienda y conserva sus
preferencias. No cierra sesión; conviene aplicarla justo antes de salir y entrar. Conserva el archivo `settings.ini` GTK4 existente y envía las
copias instaladas sustituidas a la papelera. Es necesario cerrar sesión y entrar
para cargar los módulos de Shell nuevos.

## Pruebas visuales aisladas

```bash
bash extensions/dynamic-island/tests/smoke-shell.sh
bash extensions/dock/tests/smoke-magnification.sh
SIDE_TEST_MONITORS=2 bash extensions/app-island/test-shell.sh
bash extensions/topbar/tests/check-hover.sh
bash extensions/widgets/tools/test-shell.sh
bash integrations/desktop/test-overview.sh
```

Estos comandos usan su propio bus, configuración y compositor. Nunca habilitar el
control inseguro de Shell en la sesión habitual. Las pruebas de vídeo generan un
patrón sintético en un directorio temporal; no necesitan tus vídeos personales.

## Documentación

- [Arquitectura e identificadores](docs/arquitectura.md)
- [Procedencia y licencias](docs/procedencia.md)
- [Migración y recuperación](docs/migracion.md)
- [Verificación y límites](docs/verificacion.md)
- [Cambios](docs/CHANGELOG.md)

No hay remoto configurado ni se ha publicado el contenido. Antes de distribuir
a terceros, resolver los límites de licencia señalados en procedencia.
