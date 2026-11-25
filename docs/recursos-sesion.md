# Consumo de la sesión y herramientas de desarrollo

Revisión del 25 de noviembre de 2026. No se atribuye la memoria de todo GNOME
Shell a Aurea ni se suman RSS como si fueran memoria exclusiva. Las mediciones
de procesos utilizan PSS; las cifras de CPU representan porcentaje de un núcleo.

## Herramientas MCP de Codex

La instalación local reconoce `mcp_lazy_stdio_startup`. Se habilitó mediante el
comando nativo, conservando todas las herramientas, permisos y credenciales:

```bash
codex features enable mcp_lazy_stdio_startup
codex features list | rg mcp_lazy_stdio_startup
```

Reversión:

```bash
codex features disable mcp_lazy_stdio_startup
```

La opción aparece como **under development** en el cliente probado. Una prueba
aislada con el mismo binario y un servidor MCP sintético confirmó: primer chat,
un proceso iniciado y llamada correcta; segundo chat del mismo app-server,
ningún proceso adicional antes de usar la herramienta y llamada correcta al
usarla. No se enviaron consultas a un modelo ni se usaron chats personales.

El catálogo es una caché del proceso. Un arranque nuevo de Codex todavía necesita
descubrir herramientas; esta opción evita arranques redundantes en chats posteriores,
no elimina los procesos que ya están trabajando ni garantiza ahorrar los
330–350 MiB medidos en cuatro servidores actuales. Cerrar y abrir Codex cuando
termine el trabajo aplica la configuración al proceso nuevo. No matar servidores
activos: pueden conservar una sesión de navegador, pruebas o dispositivos.

Se conservan los lanzadores Bun existentes. Los servidores que requieren Node
siguen usando Node: ejecutar `bun x` no convierte automáticamente su implementación.
No se añadió un proxy MCP casero, un watchdog ni un servicio permanente.

Referencias: [configuración oficial](https://developers.openai.com/codex/config-reference/),
[gestor de conexiones](https://github.com/openai/codex/blob/main/codex-rs/codex-mcp/src/connection_manager.rs)
y [caché del catálogo](https://github.com/openai/codex/blob/main/codex-rs/codex-mcp/src/tool_catalog_cache.rs).
El comportamiento se validó con el binario instalado, pues upstream puede cambiar.

## Interfaz de Codex

Se encontró una instancia principal con procesos de renderizado, GPU, servicios,
motor de agente y documentos. No se demostró que fueran procesos abandonados.
El paquete ya incluye control de actividad en segundo plano. No se modificó su
ASAR ni se desactivó aceleración gráfica, documentos, historial o herramientas.

El registro del proceso principal contenía 111 mensajes `ResizeObserver loop
completed with undelivered notifications` entre 442 líneas recientes. Eso es
evidencia de errores de interfaz, no prueba por sí sola de una fuga de memoria.
En una muestra de 12 segundos visible y 12 minimizada, Codex pasó de 160,7% a
188,1% y GNOME de 43,5% a 41,1% de un núcleo. La ventana fue restaurada al terminar.
No hubo mejora reproducible por minimizar ni una atribución concluyente a Aurea.
No se considera resuelto el consumo de la interfaz de Codex mediante este parche.

## GNOME Software

Se confirmó `Busy=false` y se cerró mediante `gnome-software --quit`, que usa su
apagado administrativo de trabajos. Se probó un drop-in de usuario con
`MALLOC_ARENA_MAX=2`, sin modificar RPM, Flatpak ni servicios del sistema.

PSS a los 30 segundos: 201397 KiB en la primera base, 190894 KiB con el ajuste y
197564 KiB al repetir la base. La diferencia pequeña y la variación de arranque
no justifican conservar un ajuste que puede aumentar contención entre hilos.
Se retiró el drop-in y se restauró el servicio con su entorno original.

GNOME Software mantiene vivo el monitor de actualizaciones mediante
`g_application_hold`. Suprimirlo o finalizarlo periódicamente cambiaría los avisos
y operaciones. Se conservaron `allow-updates=true`, `download-updates-notify=true`
y la preferencia previa `download-updates=false`. No se añadieron sondeos alternativos
ni se deshabilitó la tienda. Fuente: [monitor de actualizaciones upstream](https://github.com/GNOME/gnome-software/blob/main/src/gs-update-monitor.c).

## Aurea

Inicio reconstruía los botones de actividades cada segundo aunque texto, icono,
destino y orden fueran iguales. Ahora conserva los actores si la representación
no cambió; las tarjetas y sus resúmenes siguen actualizándose. Al cambiar contenido
o filtro se reconstruyen los botones y conservan sus acciones correctas.

Prueba: una actividad y 100 actualizaciones idénticas pasan de 101 construcciones
a una. Se verifican actualización de texto, cambio de destino, filtros y lista
vacía. El test nativo confirma identidad de actores en GNOME 51.1, y la prueba
completa conserva las 19 páginas, dos monitores, 100 interrupciones y liberación
al desactivar. No demuestra una reducción grande de la RAM total ni soluciona por
sí sola el consumo gráfico de otra aplicación.

```bash
./aurea.sh check
DI_TEST_MONITORS=2 bash extensions/dynamic-island/tests/smoke-shell.sh
```

Para aplicar desde un paquete etiquetado ya construido, con `aurea_paquete`
seleccionado según README:

```bash
./aurea.sh install "$aurea_paquete" --component=dynamic-island --apply
./aurea.sh install "$aurea_paquete" --component=dynamic-island --check
```

El código de la isla se carga en el siguiente inicio de sesión. No se bajaron
frecuencias de animación, se cambiaron colores ni se desactivaron extensiones.
