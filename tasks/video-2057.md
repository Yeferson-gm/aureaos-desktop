# Revisión del video de referencia de SideDock

Video aportado por el usuario: 77,872 s, 1914 × 554, sin pista de audio.
Revisado secuencialmente con 78 fotogramas a intervalos de un segundo, ampliando
las tarjetas y sus estados. No se incorporan grabación ni capturas al repositorio.
Es una galería animada de referencia; no es una grabación de errores de Aurea.
No permite comprobar los servicios que alimentan los datos ni sus permisos.

## Comparación y alcance

| Evidencia visible | Situación de Aurea y decisión |
|---|---|
| 0–8 s: CPU, batería, red, almacenamiento, agenda, listas | Ya existen. Mejorar legibilidad, color semántico, contexto de métricas y acceso a controles. |
| 8–18 s: música, descargas, pantallas, reloj mundial, QR | MPRIS ya implementado. Añadir vistas de Descargas, pantallas/discos y relojes configurables; QR queda pendiente de una biblioteca y un flujo explícito para compartir. |
| 18–31 s: concentración, mantener despierto, micrófono, memoria | Añadir controles con nombre, estado textual y sincronización con GNOME. Reutilizar el inhibidor y el mezclador existentes. |
| 31–42 s: batería con salud/temperatura, CPU con máximo | Mostrar datos disponibles de UPower y máximo observado en el historial local; nunca estimar temperatura ni salud. |
| 42–56 s: nota amarilla, calendario, portapapeles, tema oscuro | Notas, tareas y portapapeles ya existen. Añadir cambio de preferencia clara/oscura; mantener negro opaco en la isla superior. |
| 56–68 s: agua, discos, periféricos, red, agentes | Añadir unidades montadas y separar gráficamente subida/descarga. Hidratación queda como función de bienestar pendiente, no métrica del sistema. |
| 68–78 s: servidores, GitHub, acciones, monedas, uso, color | Requieren proveedores o nuevos módulos. No presentar la galería como funciones ya implementadas. |

## Funciones aún no implementadas en esta entrega

- Paneles de Slack, revisiones de GitHub y analítica de visitas/ingresos: necesitan
  conexión a la cuenta y selección explícita de proyectos/canales.
- Cotizaciones y divisas: necesitan proveedor, periodicidad y estados de antigüedad.
- Cuotas de Claude/Codex: no hay un contrato universal disponible; se mantienen
  las tareas reales del puente de asistentes, sin porcentajes ficticios.
- Docker, puertos de desarrollo y modelos locales: requieren una integración
  local dedicada; no se amplían permisos ni se ejecutan contenedores por observar
  una tarjeta en el video.
- QR al teléfono, registro de agua, alarma de acostarse y selector de color:
  pendientes; no se añaden controles sin comportamiento.
- Mascota animada: Aurea conserva la mascota opcional existente, sin copiar arte
  ni añadir un bucle permanente de animación.
- Tiempo de uso permanece en su widget existente, no se duplica la recopilación.

## Criterios de la adaptación

Cifras claras antes que decoración, títulos de 14–16 px, contexto de 12 px,
iconos nativos consistentes y color acompañado de texto. Superficie superior
negra opaca; estadísticas oscuras de alto contraste con vidrio discreto.
Ningún carrusel automático ni reordenación espontánea de tarjetas. El movimiento
de la galería no se traslada al escritorio: los controles mantienen su posición.
Consultas asíncronas acotadas, supervisión solo al abrir la vista y limpieza al
cerrar. Archivos sin copias, sin recursión y sin lectura de su contenido.

## Verificación de la entrega

- `./aurea.sh check`: 31 grupos de pruebas, sintaxis, esquemas y CSS.
- Sesiones aisladas de GNOME 50.6 y 51.1: nuevas vistas, Descargas sin temporales,
  añadir al estante, eliminación reflejada, zonas inválidas, controles sincronizados,
  micrófono con proveedor de prueba y limpieza al cerrar.
- Islas: cien aperturas/cierres interrumpidos, ausencia de captura modal residual,
  MPRIS, preferencias GTK y recarga de extensión.
- Estadísticas: lecturas locales, dos historiales de red, número de hilos,
  botón de fijar, contraste bajo tema claro y prueba de puntero real virtual.
- Revisión visual de Inicio, Controles, Descargas, Relojes, Pantallas y estadísticas.
  Se retiraron títulos duplicados y el hueco de 300 px con una sola descarga.
