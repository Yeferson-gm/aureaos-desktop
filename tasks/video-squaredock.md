# Experiencia observada en el video del usuario

Grabación local de 71,218 s, sin audio; revisión secuencial a un fotograma por
segundo y detalle de las transiciones relevantes. El video y sus capturas no
se incorporan al repositorio.

| Intervalo | Evidencia | Adaptación Aurea |
|---|---|---|
| 0–4 s | Fecha/calendario y baterías de equipo/periféricos al pasar cursor | Vistas de fecha y dispositivos con datos de UPower |
| 5–7 s | Cuotas de asistentes | Solo datos que un proveedor exponga; nunca estimar cuotas |
| 8–21 s | CPU, memoria, disco, batería y red con gráficos y detalles | Panel de estadísticas con historial acotado y subpaneles |
| 22–31 s | Notch con música, próximo evento y tiempo, detalles contextuales | Resumen con controles directos y navegación contextual |
| 32–38 s | Asistente y mascota | Usuario eligió Codex, Claude y OpenCode; sesiones interactivas y apertura explícita |
| 39–57 s | Rail estrecho y mascota decorativa | Rail funcional, sin mascota flotante obligatoria |
| 58–63 s | Carpetas en cuadrícula desde el lateral | Previsualización por hover, búsqueda y apertura de archivos |
| 64–68 s | Grupo con apps, abrir todas y desagrupar | Grupos fijables, panel contextual y acciones de organización |
| 69–71 s | Regreso al calendario por hover | Transiciones reversibles y cierre al salir |

## Aceptación

- Conservar UUID, datos, favoritos y configuración; no duplicar el lanzador general.
- No confundir métricas de ejemplo con lecturas reales; mostrar ausencia de datos.
- Cerrar paneles con Escape, clic exterior y salida del cursor sin secuestrar foco.
- Acotar operaciones de archivos y detener muestreo al ocultar paneles.
- Probar datos, paneles y ciclos de vida; verificar GNOME 50 y 51.
- Instalar componentes afectados y documentar límites reales de esta adaptación.

## Entrega

Implementados paneles de carpetas/grupos, métricas con gráficos, resumen contextual,
pronóstico, acceso desde widgets y lanzadores de asistentes con puente de tareas.
Los límites y comandos están en `docs/experiencia-contextual.md`.
