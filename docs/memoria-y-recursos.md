# Memoria y actividad en segundo plano

La optimización conserva las preferencias, el diseño y las funciones. Las
extensiones continúan en GJS, dentro del compositor de GNOME. Bun ejecuta las
herramientas del repositorio; no sustituye el motor de GNOME ni reduce por sí
solo la memoria de sus extensiones.

## Cambios verificados

| Recurso | Antes | Ahora |
|---|---|---|
| Elementos gráficos iniciales de la isla | 513 | 413; reloj y notificaciones se construyen al abrirlos |
| Respuestas HTTP de widgets retenidas | Sin límite de entradas o bytes | Hasta 64 entradas y 4 MiB de contenido estimado, con caducidad y descarte LRU |
| Dos peticiones simultáneas de la misma URL y formato | Dos transferencias | Una transferencia compartida |
| Temporizador visual de clima oculto | Despierta cada 66 ms, aunque no pinta | Detenido mientras el actor no está mapeado |
| Temporizador de esfera oculta | Despierta cada 50 o 1000 ms | Detenido mientras el actor no está mapeado |
| Foto anterior después del fundido | Sigue asignada a la capa invisible | Se retira al terminar los mismos 250 ms de fundido |

Los datos del clima siguen actualizándose con su intervalo habitual. Alarmas,
temporizadores, música y notificaciones no se suspenden por cerrar un panel.
El reloj se actualiza inmediatamente al volver a mostrarse. Un widget cubierto
por otra ventana puede seguir mapeado: la optimización no pretende detectar
oclusión completa. La frecuencia y el estilo de las animaciones visibles no cambian.

La caché separa texto y binarios. Respuestas mayores al presupuesto se entregan
sin conservarse. Al desactivar widgets se aborta la sesión HTTP y una respuesta
tardía no puede volver a llenar la caché. El presupuesto cuenta contenido UTF-16
o bytes binarios, no todo el coste de objetos del motor. En la prueba de 1000
respuestas de 128 KiB, quedan 32 respuestas (4 MiB), frente a 125 MiB sin límite.
Esta prueba sintética demuestra el límite; no representa el tráfico habitual.

## Verificación y límites

En GNOME 51.1 aislado se verificaron las 19 páginas, dos monitores, 100
interrupciones de apertura/cierre, temporizador conservado al reactivar y cero
fuentes pendientes al desactivar. Los widgets superaron sus pruebas de edición,
alta inmediata, fotos, 78 variantes visuales y recorte del vidrio. Se comprobó
la pausa/reanudación nativa de reloj y clima y su reconstrucción sin temporizadores
antiguos. La prueba unitaria repite 100 ciclos de visibilidad y destrucción.
También verifica errores de red compartidos, reintentos y respuestas de una sesión
anterior. Invertir temporalmente la protección de generación hace fallar la prueba;
se restauró el código correcto antes de empaquetar.

El benchmark compara la misma prueba contra `v0.17.1`, cuenta actores y fuentes,
y mide PSS/RSS del proceso Shell completo. Tras una apertura de calentamiento,
20 ciclos adicionales deben conservar el número de actores y fuentes. No fuerza
el recolector de basura. La reducción de 100 actores iniciales es reproducible;
las muestras de PSS no demuestran una reducción significativa de la RAM total.
No se atribuye la memoria de todo GNOME a una sola extensión. La compatibilidad
declarada con GNOME 50 permanece; esta entrega no repite su prueba de ejecución.

Registro del 25 de noviembre de 2026, ejecuciones secuenciales en el mismo equipo:

| Medición | Base `v0.17.1` | Optimización |
|---|---:|---:|
| Actores al iniciar | 513 | 413 |
| Actores tras calentamiento → 20 ciclos | 698 → 698 | 598 → 598 |
| Fuentes tras calentamiento → 20 ciclos | 2 → 2 | 2 → 2 |
| PSS al terminar reposo (KiB) | 223931 | 222174 |
| PSS al terminar los ciclos (KiB) | 225580 | 224275 |

La diferencia de PSS de esta pareja ronda 1–2 MiB y es insuficiente para
generalizar un ahorro. La mejora conservada es la reducción determinista de
objetos iniciales, el presupuesto de caché y la retirada de trabajo invisible.

```bash
./aurea.sh check
bash extensions/widgets/tools/test-shell.sh
DI_TEST_MONITORS=2 bash extensions/dynamic-island/tests/smoke-shell.sh
DI_BASELINE_REF=v0.17.1 DI_BENCHMARK=1 bash extensions/dynamic-island/tests/smoke-shell.sh
DI_BENCHMARK=1 bash extensions/dynamic-island/tests/smoke-shell.sh
```

Ejecutar los benchmarks de uno en uno con una carga comparable. Cada ejecución
informa su carpeta temporal y guarda `result.txt`, con actores, fuentes, PSS,
RSS y tiempo de CPU. Las pruebas no controlan la sesión de escritorio habitual.

## Decisiones de alcance

No se migró la interfaz a Rust ni se añadió un daemon: no hay una medición que
justifique esa complejidad. Las páginas de música y sistema conservan su creación
inicial porque reciben señales de audio y hardware aun con el panel cerrado.
Se mantuvieron las texturas y el recorte de fotografías: liberar la referencia
de la foto anterior no garantiza que la caché interna de GNOME la descarte
inmediatamente. No se redujo resolución ni se generaron copias de imágenes.

Tampoco se vacía la caché de páginas de Linux ni se desactiva swap. La memoria
reutilizable del sistema no equivale a una fuga; medir presión de memoria y PSS
es más útil que intentar mantener artificialmente toda la RAM libre.

## Aplicación local

Desde una etiqueta Git limpia, construir y aplicar únicamente los componentes:

```bash
./aurea.sh build
aurea_tag=$(git describe --tags --exact-match HEAD)
aurea_paquete="$PWD/dist/aurea-27-${aurea_tag#v}"
for aurea_componente in dynamic-island widgets; do
  ./aurea.sh install "$aurea_paquete" --component="$aurea_componente" --apply
  ./aurea.sh install "$aurea_paquete" --component="$aurea_componente" --check
done
```

Guardar el trabajo y cerrar sesión voluntariamente; volver a entrar carga el
código nuevo. `--check` verifica archivos instalados, no sustituye módulos que
GNOME ya tenga en memoria. No se cambia la configuración ni se reinicia el compositor.
