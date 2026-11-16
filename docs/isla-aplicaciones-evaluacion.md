# Evaluación de la isla de favoritas

Fecha: 16 de noviembre de 2026. Estado: propuesta; no implementada.

## Alcance y evidencia

Revisión de `extensions/app-island/extension.js`, `stylesheet.css` y pruebas
existentes. Los dos archivos de ejecución coinciden con la instalación de usuario.
La comparación externa usa páginas y documentación oficiales; no se ejecutaron
las aplicaciones de macOS ni se midió el rendimiento de la sesión actual.
Los riesgos de interacción descritos son hallazgos del código, no fallos
reproducidos durante esta evaluación.

La dirección propuesta es un panel de accesos elegidos, agrupados por actividad.
Mantener el catálogo general en el centro de aplicaciones, la gestión habitual de
apps abiertas en el Dock y las notificaciones en la isla dinámica.

## Estado actual

| Área | Implementación observada | Oportunidad |
|---|---|---|
| Accesos | Hasta 24 favoritas; primeras 5 en barra | Elegir y ordenar los accesos rápidos sin quitar y añadir |
| Categorías | Ocho grupos automáticos por metadatos y «Otras»; orden alfabético | Grupos personales, orden manual y asignación corregible |
| Panel | 360 px de ancho, hasta 560 px de alto | Altura ajustada al contenido y área útil de cada monitor |
| Apariencia | Fondo RGBA oscuro fijo, texto blanco, sin efecto de desenfoque | Material y contraste coherentes con el tema Aurea |
| Apertura | Borde visible de 6 px; hover revela barra; tirador de 7 px abre panel | Activación configurable y acceso por teclado |
| Movimiento | Geometría 340 ms; contenido aparece tras 130 ms y se desvanece en 220 ms | Respuesta inmediata y transiciones reversibles |
| Ocultación | Espera de 650 ms y desplazamiento de 220 ms | Diferenciar cruce accidental de intención de abrir |
| Búsqueda | Solo para añadir; mínimo 2 caracteres; hasta 8 resultados | Buscar también dentro de lo guardado |
| Sesión | Favoritas en JSON; categorías plegadas solo en memoria | Conservar selección, orden, plegado y scroll |
| Monitores | Monitor principal y recorte explícito a sus límites | Elección de monitor y tratamiento del borde compartido |
| Actualizaciones | Destruye barra/lista y reconstruye al cambiar estado de apps | Actualizar solo la fila afectada y conservar foco |
| Acciones | Abrir, nueva ventana con botón central, añadir/quitar favorita | Menú contextual y selección de ventana |

La pestaña «En uso» incluye todas las apps abiertas, no solo favoritas. El clic
derecho en la barra abre el panel general. Al abrirlo el foco va al botón Cerrar.
No hay preferencias propias ni atajo global registrados en este módulo.

## Referencias de macOS

| Producto | Función documentada | Adaptación útil para Aurea |
|---|---|---|
| [Sidebar](https://sidebarapp.net/) | Grupos de apps/carpetas, vistas previas y configuración por monitor | Categorías prácticas y selector de ventanas bajo demanda |
| [SideDock](https://getsidedock.com/) | Apertura desde bordes, agrupación por arrastre y carpetas como pilas | Isla cerrada discreta y organización directa |
| [Raycast](https://manual.raycast.com/quicklinks) | Accesos a URLs, archivos y carpetas, etiquetas y acciones | Buscar favoritos y añadir accesos personales |
| [Workspaces](https://www.apptorium.com/workspaces) | Recursos por proyecto y apertura de conjuntos seleccionados | Perfiles de trabajo con apps, carpeta y enlaces |

Son aplicaciones de terceros para macOS, no un diseño nativo único llamado
«isla de favoritas». La propuesta de Aurea combina patrones compatibles con su
propósito y no promete reproducir todas sus funciones.

[Apple: materiales](https://developer.apple.com/design/human-interface-guidelines/materials)
recomienda diferenciar controles y contenido, limitar el vidrio y preservar la
legibilidad. [Apple: movimiento](https://developer.apple.com/design/human-interface-guidelines/motion)
sirve como referencia de intención y accesibilidad. Las medidas y tiempos de
abajo son propuestas para Aurea, no especificaciones oficiales de Apple.

## Diseño propuesto

Panel unido al borde, con superficie única y esquinas interiores suaves. Cabecera
«Favoritas», Añadir y menú de opciones. Buscador compacto «Buscar en tu isla».
Accesos rápidos arriba; categorías plegables debajo. Cada categoría tiene nombre,
cantidad y una cuadrícula de tres o cuatro columnas según el espacio disponible.
La vista de lista permanece como alternativa para nombres largos o texto ampliado.

Evitar tarjetas dentro de tarjetas, estrellas permanentes en todas las filas,
mensajes repetidos «Lista para abrir» y pies de ayuda que ocupan altura siempre.
Mostrar acciones al enfocar, pasar el cursor o abrir el menú contextual, con
equivalentes accesibles por teclado. Mantener nombres visibles en el panel.

Puntos iniciales para prototipo: ancho 320–360 px; márgenes 16 px; separación
8–12 px; iconos 36–40 px; texto 13–14 px; título 17–18 px; radios interiores
16–20 px. Todo en unidades lógicas, adaptado al factor de texto y escala.
Usar la tipografía de interfaz Aurea disponible, pesos moderados y alineaciones
consistentes. No redistribuir tipografías propietarias por semejanza visual.

Vidrio claro u oscuro según preferencias, borde fino y sombra contenida. Fondo
sólido para alto contraste o transparencia reducida. Desenfoque recortado también
en las esquinas y detenido cuando el panel no está visible. Evitar una segunda
superficie rectangular detrás de los iconos.

## Mejoras priorizadas

### P0: interacción y estabilidad

1. Abrir con atajo configurable además del borde; indicador fino opcional.
2. Ajustar zona, espera e intención de apertura para evitar activaciones al pasar
   de una pantalla a otra. No colocar por defecto el disparador en un borde compartido.
3. Cerrar con Escape, clic exterior y botón; liberar siempre la captura de entrada.
4. Transiciones interrumpibles que parten de la posición actual; impedir cierres
   tardíos que oculten un panel recién abierto.
5. Eliminar la pausa artificial antes de mostrar contenido. Objetivo inicial:
   apertura 200–260 ms y cierre 160–200 ms, a validar en el equipo.
6. Mantener recorte por monitor durante todo el movimiento y al desconectar pantallas.
7. Reconciliar elementos por identificador conservando foco, scroll y selección.
8. Respetar animaciones desactivadas, alto contraste y tamaño de texto.
9. Mostrar errores de guardado y recuperar datos inválidos sin sobrescribir
   silenciosamente favoritos recuperables; validar y migrar el JSON actual.

### P1: favoritas y categorías

10. Crear, renombrar, ordenar y eliminar categorías personalizadas.
11. Proponer categorías automáticas al añadir y permitir corregirlas.
12. Arrastrar apps entre categorías y ordenar dentro de ellas.
13. Ofrecer «Mover a» y «Subir/Bajar» para realizar lo mismo sin arrastrar.
14. Elegir explícitamente cuáles aparecen en la barra compacta y en qué orden.
15. Conservar las categorías plegadas y la posición de lectura al reabrir.
16. Buscar entre favoritos por nombre, alias y categoría; añadir apps desde una
    acción separada, sin listar todo el catálogo al abrir la isla.
17. Sustituir «En uso» global por un filtro de favoritas abiertas; mantener el
    selector completo de apps en los componentes que ya cumplen esa función.
18. Menú contextual: abrir, nueva ventana si existe, mover, renombrar alias,
    fijar en acceso rápido y quitar con Deshacer.
19. Selector de ventanas de una favorita cuando tiene varias; estado de apertura
    inmediato para evitar lanzamientos repetidos mientras la app arranca.
20. Navegación con flechas, Enter, Tab y Escape; foco visible y nombre accesible.
21. Preferencias en vivo para lado, monitor, densidad, apertura y material, con
    restauración por sección. Persistirlas fuera del código.

### P1: acabado visual

22. Aplicar el diseño propuesto con lista/cuadrícula y altura ajustada al contenido.
23. Paletas clara y oscura con colores de texto y selección independientes del fondo.
24. Usar iconos de Aurea nítidos según escala; no deformar proporciones ni cargar
    nuevas texturas en cada cuadro de animación.
25. Estado abierto mediante un indicador pequeño estable; insignias solo si hay
    una fuente real de datos y siempre ancladas al icono correspondiente.
26. Unificar hover, pulsación, foco, selección y deshabilitado; evitar resaltar
    toda una categoría cuando el puntero está sobre una sola aplicación.
27. Ayudas breves al hover/foco y estado vacío con acción clara «Añadir favorita».
28. Movimiento de reorganización acotado, sin ampliación que empuje continuamente
    a los iconos vecinos. Mantener nítidos iconos y texto durante apertura.

### P2: funciones que amplían su utilidad

29. Carpetas elegidas como favoritas, abiertas mediante el gestor de archivos.
30. Enlaces web y archivos elegidos, con alias e icono; señalar recursos ausentes.
31. Perfiles manuales «Desarrollo», «Personal» o «Diseño» sin duplicar referencias.
32. «Abrir grupo»: lanzar solo los recursos marcados, con progreso y fallos por
    elemento; activar apps ya abiertas cuando sea posible.
33. Vista previa de ventanas tras una pausa breve, solo mientras sea visible.
34. Importar/exportar organización de forma explícita, sin subir rutas o datos
    personales al repositorio.

La apertura exacta de proyectos en editores depende de la interfaz de cada app.
No prometer reutilización universal de pestañas del navegador, restauración
exacta de todas las ventanas ni arrastre de archivos desde cualquier aplicación
Wayland sin investigar y probar la integración correspondiente. El arrastre
interno de favoritos es un trabajo separado y acotado.

## Orden de entrega y aceptación

1. Modelo de datos y preferencias con migración de favoritos actuales.
2. Apertura, cierre, foco, monitores y actualización incremental de filas.
3. Material, tipografía, categorías y organización por teclado/arrastre.
4. Búsqueda y acciones; después recursos y perfiles opcionales.

Validar cada bloque en GNOME aislado antes de instalarlo: 0, 1, 5 y 24 favoritos;
nombres largos y Unicode; categorías vacías; apps desinstaladas; errores de
persistencia; apertura interrumpida repetidamente; Escape y clic exterior; arrastre
cancelado; fondos claros/oscuros/vídeo; texto ampliado; escalas 100/125/150/200 %;
pantallas a izquierda y derecha con escalas mixtas; desconexión del monitor.

Medir reposo, apertura y scroll por separado. Objetivo: sin animación, consultas
periódicas ni desenfoque activo cuando está oculta; evitar reconstrucciones
completas por cambios de estado. Medir cuadros frente al presupuesto del monitor
(16,7 ms a 60 Hz; 8,3 ms a 120 Hz), sin presentar fluidez absoluta como garantía.

Esta evaluación añade documentación únicamente. No se cambió la extensión,
su instalación ni la configuración de la sesión.
