# Investigación y auditoría de la barra superior

Fecha: 12 de noviembre de 2026. Base local: `2677c43dc4a6f6287464384fb1247f72639a57de`.
Alcance: investigación, comparación y propuesta. No se modifica la extensión,
el tema ni las preferencias de la sesión habitual.

## Resultado de la comparación

La barra tiene una base funcional considerable. El salto de calidad requiere
ordenar materiales, estados e interacción, además de ajustar colores. No hay
evidencia para afirmar que un cambio de configuración resuelva todo.

| Antes: evidencia de Aurea | Después: propuesta | Por qué |
|---|---|---|
| Menús claros con degradados de opacidad 0,90–0,92; CC 0,88–0,90; sin efecto de blur propio | Material legible que deje pasar el fondo sin mostrar sus detalles nítidos; alternativa sólida | Transparencia de color y desenfoque son efectos diferentes |
| `box-shadow: none` en superficies y bordes claros de opacidad 0,70–0,78 | Una sombra suave de elevación y borde discreto por superficie principal | Ahora los bordes hacen demasiado trabajo y las tarjetas parecen recortes planos |
| Radios de 24 px fuera, 20 px dentro y separación de 10 px | Radios derivados de la geometría y del espaciado | Las esquinas anidadas no deben competir entre sí |
| Apertura: opacidad 0→255 en 70 ms; cierre sin animación | Apertura breve anclada al botón, cierre coherente y respuesta inmediata por teclado | Evitar una aparición desconectada del disparador sin añadir lentitud |
| Cada apertura reinicia la opacidad a cero | Conservar el estado visual al interrumpir o volver a abrir | Riesgo de destello al repetir acciones; requiere reproducción de estrés |
| La última regla CSS pinta cualquier tarjeta bajo hover/foco/active de `#3584e4` | Mantener selección azul local, distinguir hover, foco y estado encendido | Respeta la preferencia del usuario sin confundir apuntar con activar |
| Colores de barra independientes de menús ya disponibles | Conservar y exponer estas opciones en preferencias | No reconstruir lo que ya funciona |
| Grilla fija de 280 px; tamaños internos repetidos en JS y CSS | Diseño adaptable, controles elegidos y un contrato único de tamaños | Menos cortes de texto y espacios vacíos al faltar hardware |
| Clic en cualquier parte de Wi-Fi/Bluetooth conmuta el servicio | Icono para conmutar; texto o flecha para detalles | Evitar desconexiones cuando se quería consultar un dispositivo |
| Energía recorre perfiles en un orden fijo | Selector de modos disponibles con selección y explicación | El usuario debe poder elegir el resultado antes de cambiarlo |
| Menús por perfiles y atajos sintéticos; iconos elegidos con expresiones regulares | Acciones reales cuando se publiquen; fallback explícito y iconos por significado | Parecido visual no equivale a integración con los comandos de cada app |
| Configuración visual por JSON; sin `prefs.js` | Preferencias visuales con vista previa y restauración | Un cambio de aspecto no debería exigir editar un archivo |

**Dictamen:** bloquearía presentar el diseño actual como terminado. Las
prioridades son legibilidad/estados, apertura y cierre, disposición adaptable y
claridad de las acciones. No se ha demostrado un fallo general de FPS ni que la
barra sea la causa principal del consumo del equipo.

## Fuentes y referencias visuales

La referencia actual es **macOS 27 Golden Gate**, no una mezcla inadvertida de
capturas de diferentes versiones. Apple presenta refinamientos de Liquid Glass
y de los iconos de la barra en su [página oficial de macOS 27](https://www.apple.com/os/macos/).
La captura de Tahoe usada abajo es una referencia histórica de composición,
no una prueba de la apariencia exacta de todos los controles de macOS 27.

| Referencia | Qué se examinó | Aplicación a Aurea |
|---|---|---|
| [Centro de Control: imagen oficial de Apple, Tahoe](https://www.apple.com/newsroom/images/2025/06/macos-tahoe-26-makes-the-mac-more-capable-productive-and-intelligent-than-ever/article/Apple-WWDC25-macOS-Tahoe-26-Control-Center-250609_big.jpg.large.jpg) | Imagen vista: módulos flotantes, espacios, superficies translúcidas, deslizadores y estados | Evitar una gran tarjeta lechosa que envuelve muchas tarjetas igualmente pesadas |
| [Meet Liquid Glass, WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/?time=305) | Transcripción y fotogramas 05:05–05:11, muestreados a 2 fps | Relación entre disparador y menú; el ejemplo es móvil, no la cinemática exacta de la barra de Mac |
| [Modernize your AppKit app, WWDC26](https://developer.apple.com/videos/play/wwdc2026/289/?time=901) | Transcripción y fotogramas 15:01–15:09, muestreados a 1 fps; capítulos 14:24 y 15:41 | Respuesta sutil de controles y esquinas concéntricas. El ejemplo visual es Maps |
| [Principles of great design, WWDC26](https://developer.apple.com/videos/play/wwdc2026/250/?time=822) | Transcripción, especialmente 13:42 sobre acabado | Jerarquía, respuesta y consistencia como criterios de revisión |
| [Apple HIG: materiales](https://developer.apple.com/design/human-interface-guidelines/materials) | Texto oficial | Materiales por función, uso moderado y contraste antes que transparencia |
| [Apple HIG: menús](https://developer.apple.com/design/human-interface-guidelines/menus) | Texto oficial actualizado | Iconos selectivos y significativos, sin decorar cada acción |
| [Apple HIG: barra de menús](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar) | Anatomía, acciones, orden y teclado | Menús previsibles y comandos acordes con la aplicación |
| [Apple: uso del Centro de Control](https://support.apple.com/guide/mac-help/quickly-change-settings-mchl50f94f8f/mac) | Texto de soporte indexado; la apertura directa devolvió 429 | Diferenciar conmutación de detalles; personalización de controles |
| [Apple: ajustes de la barra](https://support.apple.com/en-qa/guide/mac-help/mchlad96d366/mac) | Opciones documentadas | Visibilidad, fondo y controles elegidos por el usuario |

No se ejecutó macOS ni se midieron sus tiempos internos. Los fotogramas sirven
para estudiar composición y relación espacial, no para deducir una curva de
animación o una duración exacta. Las propuestas numéricas siguientes son de
Aurea y necesitan evaluación en GNOME.

## Evidencia local y alcance de las pruebas

- Fuente: `extensions/topbar/extension.js` (3012 líneas), `stylesheet.css`
  (945 líneas), SVG y pruebas existentes.
- Instalación activa: UUID `lintel-v2@local`, nombre anterior «macOS 27 Top Bar»,
  metadatos versión 11. Sus archivos difieren de los de fuente; el diff inspeccionado
  muestra comentarios anteriores a la consolidación. La comparación textual tras
  retirar comentarios y espacios exteriores coincide en JS y CSS; no fue una
  comparación de tokens mediante parser. No se debe usar solo ese número antiguo
  para diagnosticar una regresión funcional.
- Configuración actual: texto/iconos blancos y tema de menús automático. Esta
  independencia ya existe y debe conservarse.
- Se ejecutó `bash extensions/topbar/tests/check-hover.sh` en un GNOME aislado.
  Resultado PASS: hover localizado en ambos temas, teclado nativo oculto y
  desactivación/reactivación correctas; sin errores críticos detectados por el test.
- Se vieron las capturas claras y oscuras generadas por esa prueba. El patrón de
  bordes claros, relleno lechoso, tarjetas anidadas y azul uniforme está presente.
- La prueba fuerza pseudoestados y llama métodos de controles. No es una prueba
  integral con clic físico; no demuestra accesibilidad, rendimiento ni todos los
  estados de hardware. Los controles de brillo/audio ausentes en el bus aislado
  no prueban que falten en la laptop.
- No se habilitó evaluación insegura ni se reinició el Shell habitual. El aviso
  de modo inseguro visible en las capturas pertenece exclusivamente al Shell de prueba.

Rutas temporales de evidencia: `/tmp/aurea-topbar-research/` y
`/tmp/topbar-hover-bE8hjsw0/`. No se incorporan imágenes de Apple, capturas con
datos locales ni vídeos al repositorio.

### Puntos del código que sustentan el diagnóstico

| Área | Ubicación de fuente |
|---|---|
| Iconos inferidos del texto español | `extension.js:95` y `extension.js:1162` |
| Símbolo ⌘ que representa Ctrl | `extension.js:166` |
| Envío diferido de atajos | `extension.js:226` |
| Opciones visuales y recarga JSON | `extension.js:285` |
| Cambio cíclico de energía | `extension.js:561` |
| Cuidado de batería existente | `extension.js:623` |
| Sondeo de cámara mediante proceso cada cuatro segundos | `extension.js:1017` |
| Apertura/cierre de menús | `extension.js:1206` |
| Perfiles de aplicaciones y menús genéricos | `extension.js:1472` y `extension.js:3001` |
| Tarjetas, toggles, accesos y grilla | `extension.js:2374` y `extension.js:2635` |
| Reloj: tick por segundo, texto sin segundos | `extension.js:2717` |
| Tema de barra y tema de menús | `extension.js:2953` |
| Material de menús y CC | `stylesheet.css:159`, `459`, `824` |
| Tamaños, estados y deslizadores | `stylesheet.css:479`, `493`, `610`, `645`, `934` |

## Lista completa de mejoras propuestas

P0: corregir antes de dar por terminado el rediseño. P1: acabado y uso diario.
P2: ampliación opcional. **Config**: ya existe opción. **Código**: requiere
implementación. **Validación**: no se presenta como un defecto reproducido.

### Barra, geometría y distribución

1. **P1 · Código · Escala coherente.** Sustituir medidas dispersas de altura,
   espaciado, iconos y tipografía por un sistema común; preservar la barra compacta.
2. **P1 · Código · Espaciado óptico.** Ajustar separación por grupos y área de
   clic, no solo por el ancho del dibujo; batería y logo necesitan compensación.
3. **P0 · Código/validación · Zona reservada al notch.** Medir espacio disponible
   y resolver colisiones de menús largos con la isla; no ensancharla como solución.
4. **P1 · Código · Desbordamiento ordenado.** Ocultar indicadores secundarios en
   un menú de excedentes cuando no quepan; conservar acceso por teclado.
5. **P1 · Código · Visibilidad elegible.** Siempre, al estar activo o nunca para
   cada indicador; orden configurable y restauración del orden anterior.
6. **P1 · Código · Títulos y reloj estables.** Ancho limitado para la app activa,
   elipsis con nombre completo accesible y cifras sin saltos de ancho.
7. **P1 · Código · Formato de fecha y hora.** Respetar preferencias 12/24 h,
   fecha y segundos; el formato actual está fijado en el código.
8. **P0 · Validación · Pantallas y sesión.** Probar escalas mixtas, monitor primario,
   fullscreen, overview, bloqueo y reconexión; coordinarlo con la isla y el dock.

### Colores, vidrio, sombras e iconografía

9. **P0 · Config · Separación de colores.** Conservar blanco en la barra aunque
   el sistema esté claro; textos de los menús según su propia superficie.
10. **P1 · Código · Contraste adaptable opcional.** El modo auto actual sigue
    claro/oscuro del sistema, no la luminosidad del fondo. Si se añade adaptación,
    usar histéresis para evitar destellos con el vídeo; respetar siempre la elección manual.
11. **P1 · Código · Material de vidrio realista.** Evaluar blur de fondo limitado
    al panel abierto, tinte y saturación discretos; no llamarlo réplica del shader de Apple.
12. **P0 · Código · Alternativa sólida legible.** Controles utilizables con menor
    transparencia, alto contraste o GPU limitada, manteniendo la misma geometría.
13. **P1 · Código · Sombra de elevación.** Una sombra suave exterior, diferente
    para claro/oscuro; evitar doble contorno y la vieja franja negra.
14. **P1 · Código · Bordes menos dominantes.** Reducir la línea blanca constante
    en todas las tarjetas; separar por espacio y material, no por múltiples marcos.
15. **P1 · Código · Esquinas concéntricas.** Derivar radios internos del radio
    exterior y del espacio; aplicar la regla por componente, no un radio universal.
16. **P0 · Código · Paleta semántica.** Unificar acento, selección, foco, apagado,
    pendiente, error y permiso; hoy conviven varios azules sin contrato explícito.
17. **P1 · Código · Iconos coherentes.** Unificar grosor, tamaño óptico y línea
    base de SVG propios y símbolos del tema; verificar ambos fondos.
18. **P1 · Código · Tipografía legible.** Revisar subtítulos de 7,75 pt, contraste
    secundario y truncado; respetar la escala de texto sin depender de fuentes de Apple.

### Animación e interacción

19. **P1 · Código · Apertura ligada al botón.** Una transformación pequeña desde
    el disparador para paneles; sin rebotes grandes ni deformación persistente del texto.
20. **P1 · Código · Cierre coherente.** Trayectoria inversa breve y liberación
    de entrada inmediata; la estética no debe mantener un bloqueo invisible.
21. **P0 · Código · Transiciones interrumpibles.** Retomar opacidad/posición
    actuales al repetir clic o cambiar de panel; no reiniciar siempre desde cero.
22. **P1 · Código · Diferenciar frecuencias.** Menús de texto y cambio entre
    menús casi instantáneos; movimiento más expresivo reservado al Centro de Control.
23. **P0 · Código/validación · Movimiento reducido.** Comprobar el ajuste de GNOME
    y definir una alternativa sin movimiento espacial. No asumir que falta soporte
    solo porque `actor.ease` pueda aplicar preferencias globales internamente.
24. **P1 · Código · Hover azul local.** Mantenerlo por control como pidió el
    usuario; distinguirlo del estado activado mediante intensidad, icono y marca persistente.
25. **P1 · Código · Feedback de pulsación.** Respuesta inmediata y discreta al
    presionar, cancelación al salir y activación una sola vez al soltar.
26. **P0 · Validación · Foco y cierre.** Escape, segundo clic, clic exterior,
    Tab/flechas y cambio entre menús; probar ratón virtual real, no solo métodos directos.

### Centro de Control y detalles

27. **P1 · Código · Composición más ligera.** Menos tarjetas anidadas y grupos
    de distinta jerarquía; decidir un sistema propio inspirado en la referencia, no mezclar versiones.
28. **P1 · Código · Edición de módulos.** Añadir, quitar, ordenar y elegir tamaño;
    mostrar primero lo usado diariamente y guardar la distribución.
29. **P0 · Código/validación · Adaptar altura y ancho.** Medir el espacio real,
    asegurar acceso a todo con desplazamiento cuando haga falta y probar 720p/texto ampliado.
30. **P1 · Código · Vacíos y cadenas largas.** Reacomodar módulos al desaparecer
    hardware; manejar SSID, nombres de dispositivos y traducciones largas sin huecos extraños.
31. **P0 · Código · Separar activar y explorar.** Icono para toggle y zona de
    detalles para Wi-Fi/Bluetooth; accesibilidad y objetivos de clic inequívocos.
32. **P1 · Código · Detalle dentro del panel.** Mostrar redes, dispositivos o
    salidas en una subvista con regreso; compartir modelos con los popups individuales.
33. **P1 · Código · Energía seleccionable.** Ahorro, balanceado y rendimiento
    solo si existen; mostrar perfil actual, limitaciones y operación pendiente.
34. **P1 · Código · Cuidado de batería explícito.** Exponer modo/límite real
    del backend instalado y distinguirlo del porcentaje y del perfil de energía.
35. **P1 · Código · Deslizadores completos.** Valor accesible, icono legible a
    volumen cero, rueda/teclado y estado de silencio; evitar que el icono pierda contraste
    al pasar del tramo rellenado al vacío.
36. **P1 · Código · Entradas y salidas de audio.** Elegir dispositivo real,
    mantener selección estable y enseñar ausencia de micrófono; no duplicar el reproductor de la isla.
37. **P1 · Código · Luz nocturna y No molestar.** Separar habilitación, estado
    activo y programación; opciones de duración cuando el backend lo permita.
38. **P0 · Código · Acciones honestas.** VPN/Pantallas/Ethernet abren Ajustes hoy;
    indicarlo visualmente. Si se implementa control directo, mostrar pendiente/error/confirmado.

### Menús, integración y preferencias

39. **P1 · Código · Iconos selectivos en menús.** Reducir decoración automática;
    conservar los que ayudan a reconocer acciones importantes o dispositivos.
40. **P1 · Código · Alineación de filas.** Columnas estables para selección,
    etiqueta, atajo y submenú; separadores discretos y zonas clicables consistentes.
41. **P0 · Código · Menús acordes con cada aplicación.** Priorizar acciones
    exportadas cuando existan. Los perfiles genéricos deben ser un fallback limitado,
    sin afirmar integración universal en GTK/Qt/Electron.
42. **P0 · Código · Atajos veraces.** El símbolo ⌘ representa Ctrl actualmente;
    ofrecer presentación real de Linux o explicar el mapeo. No anunciar combinaciones
    de ocultar/cerrar como registradas si solo funcionan al pulsar el menú.
43. **P0 · Código · Destino de acciones estable.** Validar que la ventana original
    siga existiendo antes de enviar teclas; no entregar un atajo a otra app por una carrera de foco.
44. **P1 · Código · Comandos disponibles.** Distinguir deshabilitado, no soportado
    y error; no mostrar Guardar/Deshacer como universalmente utilizables.
45. **P1 · Código · Preferencias visuales.** UI para las opciones JSON existentes,
    espaciado, módulos, apariencia y movimiento; vista previa y restauración por sección.
46. **P1 · Código · Proveedores compartidos.** Topbar e isla consultan estados
    reales coherentes; conservar un único proveedor visible de avisos, sin nuevas duplicidades.

### Accesibilidad, rendimiento y entrega

47. **P0 · Código/validación · Accesibilidad.** Nombres, roles y estado seleccionado
    de tarjetas e interruptores; foco visible, orden predecible y contraste medido.
48. **P1 · Código · Privacidad precisa.** Diferenciar permitido de en uso; mostrar
    la app responsable solo si el backend la identifica. «Protegida» no debe prometer
    bloqueo universal por cambiar preferencias GNOME.
49. **P1 · Código/perfilado · Sondeo eficiente.** Revisar el proceso de búsqueda
    de cámara cada cuatro segundos y el reloj por segundo sin segundos visibles;
    preferir señales cuando existan y reducir trabajo redundante con datos medidos.
50. **P0 · Código · Operaciones asíncronas robustas.** Cancelación, estado pendiente,
    recuperación de servicios y control de doble clic; no bloquear Shell esperando red/hardware.
51. **P1 · Código · Separación de responsabilidades.** Modelos de sistema, comandos,
    configuración, componentes, estilo y movimiento en módulos pequeños; evitar ampliar
    el archivo monolítico para cada nueva opción.
52. **P0 · Validación · Ciclo de vida.** Cerrar y destruir durante transiciones;
    restaurar indicadores nativos, estilos y señales sin reapariciones duplicadas.
53. **P0 · Validación · Matriz visual.** Claro/oscuro, fondos claros/oscuros y vídeo,
    contraste alto, fuentes grandes y escalas 100/125/150/200 %; una y dos pantallas.
54. **P0 · Validación · Fluidez medida.** Comparar CPU/GPU, memoria y tiempos de
    fotograma antes/después; 16,67 ms a 60 Hz y 8,33 ms a 120 Hz como presupuestos,
    no resultados prometidos. Cien aperturas/cierres interrumpidos sin residuos.
55. **P1 · Entrega · Una fuente y una instalación verificable.** Preservar UUID y
    configuración; entregar desde Git, migrar metadatos antiguos y comprobar archivos
    instalados sin editar directamente la copia de GNOME.
56. **P2 · Código · Ocultamiento y extras elegibles.** Autohide/visibilidad por
    contexto y controles secundarios opcionales; no añadir otra cuadrícula de apps
    ni trasladar funciones de la isla sin una razón de uso.

## Qué se puede configurar hoy

`~/.config/lintel-v2/config.json` admite `texto`, `colorTexto`, `colorIconos`,
`temaMenus` y `animacionMs`, y se recarga al guardar. Blanco arriba con menús
automáticos ya está configurado. Ajustar `animacionMs` cambia el fundido; no añade
trayectoria, cierre animado, blur, sombras, edición de módulos ni integración de menús.

No se cambia ese archivo durante esta investigación. Tampoco se debe revertir
la selección azul local que el usuario pidió: se propone mejorar la separación
entre estados, no eliminar su preferencia.

## Orden de implementación y criterios de aceptación

1. **Fundación:** tokens semánticos, estados, foco, apertura/cierre y accesibilidad.
2. **Acabado visual:** materiales, bordes, sombras, tipografía y geometría adaptable.
3. **Uso diario:** separar toggle/detalle, energía, batería, audio y preferencias.
4. **Integración y opcionales:** menús reales donde existan, editor de módulos,
   autohide y extras; después de cerrar los P0.

Valores iniciales para prototipos, no medidas internas de macOS: feedback
100–160 ms y popovers pequeños 125–200 ms; navegación frecuente y teclado sin
desplazamiento animado. Para el CC, probar una entrada de 180 ms y cierre de
125 ms; transformación inicial 0,97 como máximo de amplitud propuesta, con origen
en el botón. Si ablanda el texto, preferir pequeña traslación/opacidad. Revaluar
con capturas de fotogramas y fondo animado antes de fijar valores.

El blur debe aplicarse al fondo, no al texto. [GNOME documenta](https://gnome.pages.gitlab.gnome.org/gnome-shell/shell/class.BlurEffect.html)
que el modo de fondo puede ser costoso. La documentación web consultada corresponde
a API 52; cualquier implementación debe verificar las propiedades disponibles en
GNOME 50.6 local. No trasladar `backdrop-filter`, APIs de AppKit ni reglas de GPU
de un navegador como si fueran APIs de St/Clutter.

Aceptación: sin texto cortado ni bordes dobles; todos los controles alcanzables;
un gesto ejecuta una acción; estado del sistema y UI coincidentes; cierre siempre
libera la entrada; sin tareas/actores/señales acumulados; contraste comprobado sobre
composición real y coste incremental medido frente al mismo fondo de vídeo.

## Límites y decisiones que se conservan

- La barra permanece sin borde exterior. La sombra propuesta es de los popups.
- Se conserva texto blanco independiente del modo claro, menú automático y notch
  con la geometría aprobada. Este trabajo no rediseña la isla ni los widgets.
- No copiar recursos propietarios ni prometer SF Symbols/San Francisco en Linux.
- No prometer AirDrop, controles de macOS o integración de todas las aplicaciones
  cuando el backend GNOME no los ofrece.
- Las capturas aisladas no incluyen todo el tema Aurea, vídeo y extensiones de la
  sesión real; los conflictos entre esos componentes siguen siendo una validación pendiente.
- Esta lista mezcla hallazgos confirmados, mejoras de diseño y pruebas pendientes,
  identificados como tales. No son 56 bugs reproducidos.
