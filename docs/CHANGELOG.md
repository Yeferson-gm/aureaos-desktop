# Cambios

## 0.17.3

- Inicio reutiliza botones de actividades cuando texto, icono, destino y orden
  no cambian. Conserva acciones, filtros, transiciones y diseño.
- Pruebas de 100 actualizaciones y documentación del consumo de la sesión,
  configuración nativa de MCP y ajustes de sistema descartados tras medirlos.

## 0.17.2

- Construcción diferida de reloj y notificaciones: 100 actores menos al iniciar
  la isla, conservando alarmas y estados de notificación.
- Caché HTTP de widgets limitada a 64 entradas y 4 MiB de contenido estimado,
  caducidad y peticiones concurrentes compartidas por URL y formato.
- Pausa de temporizadores visuales de clima y esferas ocultas, con reanudación
  inmediata; liberación de la capa de foto anterior al completar el fundido.
- Pruebas de visibilidad, caché, cierre, reconstrucción y recursos estables;
  documentación de mediciones y límites sin prometer un ahorro global de RAM.

## 0.17.1

- Restaurar y minimizar con fases suaves, 300 ms por defecto y sin repintados
  explícitos de todas las ventanas; conserva las duraciones personalizadas.
- Arrastre con física independiente de la frecuencia de pantalla, sin actualizar
  fotogramas al quedar quieto y sin recuperar trabajo ilimitado después de pausas.
- Libera animaciones interrumpidas, evita superponer arrastre y lámpara y respeta
  las preferencias de movimiento. Pruebas reproducibles de fluidez y ciclo de vida.

## 0.17.0

- Islas laterales sin marcas permanentes: favoritas desde el borde y baterías de
  mouse, teclado, audífonos y equipo al pasar el cursor, con UPower/BlueZ.
- Música con progreso de ancho completo, portada compacta, nombre del reproductor,
  cola MPRIS, selección de pistas y retirada cuando la aplicación lo permite.
- Avisos de conexión Bluetooth con porcentaje disponible; respuestas antiguas no
  sustituyen un estado de conexión más reciente.
- Apertura superior por hover activada por defecto, cierre suave de estadísticas
  y movimiento del dock con velocidad continua al cambiar de dirección.
- Mantiene los favoritos y archivos existentes, la nitidez de iconos y los límites
  de monitor. Sin nuevos efectos de nieve ni funciones de carpetas de la referencia.

## 0.16.2

- Corrige los iconos suavizados del dock en reposo: se renderizan a su tamaño
  normal y conservan otra representación para la ampliación, sin recargas por cuadro.
- Añade una comparación visual automatizada contra iconos nativos y el método
  anterior, con comprobaciones de reutilización de texturas y desactivación.

## 0.6.1

- Unifica acceso GDM y bloqueo en un solo módulo global: Aurea 27 · Acceso y bloqueo.
- Migra el perfil de GDM y retira Aurea Login antigua; permite retirar la copia de
  usuario conservando su activación. El instalador evita volver a duplicarla.
- Documenta que GNOME mantiene en memoria fichas de extensiones retiradas hasta
  un nuevo inicio de sesión; Dash to Dock ya no forma parte de la instalación.

## 0.6.0

- Pack de 19 componentes: incorpora diez extensiones desde revisiones upstream
  compatibles con GNOME 50, con nombres y UUID Aurea, licencias y procedencia.
- Migración de activación y preferencias; Emoji Copy permanece independiente y
  Aurea Login se conserva para GDM. Retirada de RPM redundantes documentada.
- Corrige hojas CSS temporales de la barra que podían romper la recarga del tema.
- Corrige controles decimales de Indicadores, grupo duplicado en preferencias del
  Selector y desactivación de Cuidado de batería sin indicador inicializado.
- Compila traducciones y recursos; prueba ventanas de ajustes, recarga de temas,
  ciclos de activación y carga/descarga del stack en GNOME aislado.

## 0.5.0

- Integra el tema completo de arranque como Aurea 27 · Arranque, con instalador
  Fedora UEFI, comprobación y restauración administrativa.
- Retira la entrada manual de Arch externo, conserva Windows y Fedora BLS con
  sus kernels; oculta el acceso manual UEFI y conserva las actualizaciones fwupd.
- Validación de sintaxis antes de sustituir el menú, respaldo de configuración
  y tema, reversión ante fallos y documentación en el README principal.

## 0.4.8

- Widgets nuevos visibles inmediatamente: entra en edición antes de iniciar la
  aparición y termina en estado visible si la transición se interrumpe.
- Un widget por tipo, incluso ante clics repetidos. La galería ofrece Mostrar y
  Ajustes para los existentes; retira Duplicar de edición y ajustes.
- Migración aditiva de copias antiguas: conserva la primera configuración por
  tipo y archiva las demás en el mismo archivo, sin borrar datos personales.
- Regresiones en Shell real aislado: alta, interrupción, doble clic, galería,
  retirada y nueva alta, persistencia y migración repetida.

## 0.4.7

- Widgets: clima con azules y cian más saturados, tormentas violetas y paletas
  diferenciadas para lluvia, nubes, nieve y niebla, de día y de noche.
- Nubes de precipitación más luminosas y gotas cian; texto secundario más legible.
- Vidrio oscuro sin atenuación adicional del fondo y tinte neutro más luminoso.
  Conserva colores personalizados, opacidad, posiciones, datos y animaciones.
- Pruebas de contraste del clima y capturas de siete condiciones de día/noche.

## 0.4.6

- Dock: recalcula la extensión del fondo al cambiar su ancho y omite medidas
  transitorias no válidas mientras se actualizan los iconos.
- Evita separadores contiguos junto a la papelera tras cerrar aplicaciones y
  conserva su posición en actualizaciones repetidas.
- Regresiones de tamaño, favoritos, animación de retirada y asignación tardía.

## 0.4.5

- README principal con comandos para seleccionar el paquete desde Git, construir,
  instalar y actualizar bloqueo y GDM, activar, comprobar y restaurar.
- Distingue privilegios, reinicio de sesión, política del teclado virtual y retirada
  del logo; corrige ejemplos de versiones antiguas y el estado del remoto.
- Guía de GDM alineada con el paquete y los recursos actuales.

## 0.4.4

- Retira logo y texto de Fedora desde la configuración nativa de GDM.
- Desactiva el teclado virtual en GDM y evita su apertura por foco, petición
  pendiente o gesto durante el acceso y bloqueo; conserva el teclado físico.
- Política compartida y reversible entre acceso y bloqueo; comprobación con
  teclado nativo aislado y lectura real de la base dconf compilada.

## 0.4.3

- Listas GVariant tipadas en dconf, comprobadas con su compilador real.
- Lectura del perfil GDM con entorno temporal propio del usuario de acceso.
- Una incidencia de los controles decorativos conserva el acceso nativo.
- La reversión de una instalación inicial fallida retira también su directorio
  vacío para que Shell no lo confunda con una extensión incompleta.

## 0.4.2

- Acceso GDM ajustado a la referencia aportada: fondo WhiteSur a color, avatar
  circular superior, contraseña compacta y tres controles de energía inferiores.
- Presentación exclusiva de GDM, con acciones nativas y restricciones del sistema;
  instalación administrativa reversible sin alterar la autenticación.
- Pruebas aisladas del formulario, geometría, puntero, acciones, ciclo de vida,
  instalación, restauración y rechazo de archivos modificados externamente.

## 0.4.1

- Integración de tema para GDM, la pantalla de encendido/cierre de sesión que
  permanece independiente de la extensión de bloqueo del usuario.
- Fondo WhiteSur estático, controles de acceso y tipografía Aurea; recursos de
  GNOME y alto contraste conservados, sin modificar autenticación ni servicios.
- Instalación administrativa reversible, checksums, sustitución atómica y pruebas
  de restauración y formulario protegido nativo en sesión aislada.

## 0.4.0

- Bloqueo nativo con fondo WhiteSur estático, fecha sobre reloj fino y perfil
  inferior; restauración al desactivar y espacio reservado al teclado.
- Widgets con tipografía Adwaita, sombras suaves, clima atmosférico y pronóstico
  compacto, calendario de mes y relojes mundiales con esferas día/noche.
- Fotografías con transición breve y movimiento reducido respetado en entrada,
  edición, clima, reloj, fotos y hojas de ajustes.
- Vidrio continuo con recorte compartido y regiones proyectadas durante edición;
  se conservan la geometría y los controles del dock.
- Ajustes construidos antes de abrir el modal, foco de campos controlado y
  regresiones visuales con 78 variantes de widgets y datos sintéticos.

## 0.3.2

- Recorte del desenfoque en el framebuffer: elimina las esquinas rectangulares
  que la máscara de la entrega anterior no alcanzaba a recortar.
- Prueba visual por píxeles con fondo de contraste, en reposo y ampliación;
  verifica tanto la ausencia de vidrio exterior como el desenfoque interior.

## 0.3.1

- Desenfoque de toda la superficie del Dock con máscara de esquinas redondeadas,
  eliminando el rectángulo interior y su oscurecimiento adicional.
- Texturas de iconos cargadas para la ampliación máxima, con tamaño base y
  geometría conservados; comprobación de resolución real en GNOME aislado.
- Área de clic de los iconos desplazados fuera del contenedor de scroll alineada
  con su representación; regresión probada con ampliación de 1,75×.

## 0.3.0

- Dock con materiales claros/oscuros, alto contraste y preferencias Aurea en vivo.
- Rebote breve, respeto al movimiento reducido y suspensión de lente durante
  arrastre y menús. Limpieza de referencias a iconos destruidos.
- Vidrio estirado mediante transformaciones, sin redistribución por cuadro.
- Corrección de opacidad al pulsar, recorte por monitor, punto único en vivo y
  listado de monitores sin duplicados al actualizar las preferencias.
- Pruebas de entrada virtual, ventanas GTK, preferencias y fondo animado sintético.

## 0.2.2

- Micrófono incluido por defecto en el Centro de Control cuando existe una entrada
  disponible, con volumen, silencio y selección de dispositivo.
- El notch unido al borde adopta la altura real de la barra y responde a sus
  cambios, sin invadir las ventanas. Conserva ancho, forma y panel expandido.
- Verificación de altura y micrófono en la sesión GNOME aislada; apertura y cierre
  de la isla con ratón y teclado sin retener la entrada.

## 0.2.1

- La fecha queda al final de la barra, también después de añadir indicadores de
  otras extensiones. Se conserva el orden relativo de esos indicadores.
- Cafeína aparece por defecto en el Centro de Control cuando está disponible su
  proveedor instalado. Conserva el interruptor y estado real mediante `cli-toggle`.
- Pruebas aisladas para indicadores añadidos después de iniciar la barra y para
  la presencia, activación y cambios externos de Cafeína.

## 0.2.0

- Centro de Control editable con subvistas de redes, Bluetooth, audio, energía,
  batería, privacidad y No molestar temporal.
- Material vidrio con alternativa sólida, colores independientes, contraste,
  movimiento reducido y cierre sin retener entrada.
- Barra adaptable al notch, indicadores ordenables, excedentes, ocultamiento y
  reloj configurable. Menús publicados por aplicaciones y atajos de compatibilidad
  dirigidos a la ventana original.
- Preferencias GTK4 con vista previa, restauración y guardado atómico.
- Monitor nativo de cámara y menos trabajo periódico. Pruebas aisladas de entrada,
  escalas, múltiples monitores, 100 interrupciones y ciclo de vida.

## 0.1.1

- Corregida la apertura de la isla dinámica al hacer clic en el notch.
- Activación nativa única para ratón y teclado, con prueba de entrada real del
  compositor aislado y cierre sin bloquear la pantalla.

## En desarrollo

- README operativo con instalación, activación/desactivación, alternativas
  incompatibles, selección del tema y recuperación sin reiniciar el compositor.
- Instalador rechaza opciones incompatibles, destinos enlazados y migraciones
  inválidas antes de sustituir componentes; comprueba herramientas y bus de sesión.
- Preparación de cada destino separada del flujo principal, con limpieza de
  temporales al fallar antes de la sustitución y conservación de ajustes GTK4.
- Detección de User Themes tanto en instalaciones del usuario como del sistema.
- La etiqueta y el paquete inicial `v0.0.1` permanecen intactos.

## 0.0.1

- Consolidación inicial de ocho componentes de GNOME y el tema completo Aurea 27.
- Marca propia visible, conservando los contratos técnicos y los créditos.
- Fuentes únicas, versión derivada de Git y construcción común verificable.
- Comentarios explicativos trasladados a Markdown.
- Pruebas relativas al repositorio y vídeos sintéticos para comprobaciones aisladas.
- Conservadas las mejoras de diseño e interacción previas; no se reinicia la funcionalidad.
