# Catálogo 1–110 · Isla dinámica v20

Actualizado: 24 de octubre de 2026. «Probado» indica la evidencia descrita, no certificación universal de aplicaciones o hardware. «Funcional» indica implementación real con validación manual restante. La versión no completa todavía las 110 funciones.

| Nº | Función solicitada | Estado | Evidencia o pendiente concreto |
|---:|---|---|---|
| 1 | Detectar automáticamente la música reproducida. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 2 | Mostrar título y artista en tiempo real. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 3 | Mostrar carátula del álbum. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 4 | Reproducir y pausar. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 5 | Cambiar a la canción anterior o siguiente. | funcional | Métodos Previous/Next y capacidades MPRIS; falta comprobar reproductores reales. |
| 6 | Adelantar o retroceder, si el reproductor lo permite. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 7 | Barra de progreso interactiva. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 8 | Aleatorio y repetición, cuando estén disponibles. | funcional | Shuffle/LoopStatus disponibles cuando el reproductor los publica. |
| 9 | Visualizador gráfico animado de sonido. | en desarrollo | Indicador de reproducción animado; no es un espectro real de PipeWire. |
| 10 | Letras sincronizadas, mediante una fuente compatible. | pendiente | Requiere elegir fuente de letras y construir sincronización. |
| 11 | Compatibilidad MPRIS con Spotify, VLC y otros reproductores. | funcional | Descubrimiento MPRIS y selección automática/manual. Compatibilidad depende de cada reproductor/navegador. |
| 12 | Detección de reproducción en navegadores compatibles. | funcional | Descubrimiento MPRIS y selección automática/manual. Compatibilidad depende de cada reproductor/navegador. |
| 13 | Selección de dispositivos de salida de audio. | funcional | Gvc: salida predeterminada y volumen por aplicación. No se cambiaron dispositivos reales durante las pruebas. |
| 14 | Volumen independiente de aplicaciones. | funcional | Gvc: salida predeterminada y volumen por aplicación. No se cambiaron dispositivos reales durante las pruebas. |
| 15 | Mini reproductor en la cápsula cerrada. | probado | MPRIS: servicio de prueba aislado, metadata, carátula, PlayPause, Seek y cápsula. |
| 16 | Vista ampliada de portada y letras. | en desarrollo | Portada ampliada implementada; letras aún pendientes. |
| 17 | Porcentaje de batería. | probado | Lecturas reales en el equipo / sesión aislada: UPower, /proc, filesystem, hwmon y NVIDIA cuando disponible. |
| 18 | Estado de carga y desconexión. | funcional | Cambios y estimaciones de UPower. No se simuló desconectar físicamente el cargador. |
| 19 | Tiempo estimado de batería cuando esté disponible. | funcional | Cambios y estimaciones de UPower. No se simuló desconectar físicamente el cargador. |
| 20 | Batería de dispositivos Bluetooth compatibles. | funcional | BlueZ en bus de sistema; dispositivos conectados y Battery1 si lo expone el dispositivo. |
| 21 | Control de volumen. | funcional | Gvc: salida predeterminada y volumen por aplicación. No se cambiaron dispositivos reales durante las pruebas. |
| 22 | Brillo de pantalla. | funcional | Main.brightnessManager de GNOME 50; se oculta sin escala disponible. Falta prueba física del deslizador. |
| 23 | Brillo de teclado compatible. | funcional | API Keyboard de SettingsDaemon, controles cuando hay brillo disponible. |
| 24 | Wi-Fi y estado de conexión. | funcional | NetworkManager: estado, interruptor Wi-Fi y conexiones VPN activas. |
| 25 | Bluetooth y dispositivos. | funcional | BlueZ en bus de sistema; dispositivos conectados y Battery1 si lo expone el dispositivo. |
| 26 | CPU, RAM y GPU. | probado | Lecturas reales en el equipo / sesión aislada: UPower, /proc, filesystem, hwmon y NVIDIA cuando disponible. |
| 27 | Temperaturas compatibles. | probado | Lecturas reales en el equipo / sesión aislada: UPower, /proc, filesystem, hwmon y NVIDIA cuando disponible. |
| 28 | Velocidad de transferencia de internet. | funcional | Diferencias de /proc/net/dev cada 1,5 s solo con Sistema visible. |
| 29 | Almacenamiento y discos. | probado | Lecturas reales en el equipo / sesión aislada: UPower, /proc, filesystem, hwmon y NVIDIA cuando disponible. |
| 30 | Estado de VPN. | funcional | NetworkManager: estado, interruptor Wi-Fi y conexiones VPN activas. |
| 31 | Indicador de bloqueo de mayúsculas. | funcional | Estado real del keymap de Clutter. |
| 32 | Indicadores de cámara y micrófono cuando puedan detectarse de manera fiable. | limitado por plataforma | No se ofrece vigilancia universal de cámaras/micrófonos de otras aplicaciones. |
| 33 | Notificaciones propias de la isla. | probado | Cola acotada y priorizada, notificaciones nativas y temporizador persistente en sesión GNOME aislada. |
| 34 | Integración con notificaciones de otras aplicaciones, cuando GNOME lo permita. | probado | Cola acotada y priorizada, notificaciones nativas y temporizador persistente en sesión GNOME aislada. |
| 35 | Vista previa de mensajes con autorización. | funcional | Vista de notificaciones nativas; títulos en cápsula ocultos por defecto, configurables. |
| 36 | Respuestas rápidas en aplicaciones compatibles. | limitado por plataforma | Activación de notificación disponible; respuestas inline requieren integración específica. |
| 37 | Varias actividades simultáneas. | probado | Cola acotada y priorizada, notificaciones nativas y temporizador persistente en sesión GNOME aislada. |
| 38 | Progreso de descargas detectables. | pendiente | Falta integrar protocolos de progreso de navegadores/gestores de descargas; no se inventa progreso. |
| 39 | Progreso de transferencias propias. | en desarrollo | Operaciones propias asíncronas con estados inicio/fin/error; falta progreso cuantitativo e historial persistente. |
| 40 | Progreso de scripts y operaciones controladas por la isla. | en desarrollo | Operaciones propias asíncronas con estados inicio/fin/error; falta progreso cuantitativo e historial persistente. |
| 41 | Cuenta regresiva de temporizadores. | probado | Cola acotada y priorizada, notificaciones nativas y temporizador persistente en sesión GNOME aislada. |
| 42 | Estado de grabación de pantalla. | funcional | Señal nativa screencast-in-progress; indicador de duración desde que se observa el inicio. |
| 43 | Avisos de llamadas compatibles. | pendiente | Requiere integración con una aplicación de llamadas concreta. |
| 44 | Próximos eventos del calendario. | funcional | Eventos del servidor de calendario GNOME, según cuentas configuradas. |
| 45 | Resultados deportivos mediante un proveedor externo autorizado. | pendiente | Faltan proveedor, autorización y contrato de datos. No se realizan consultas ni compras. |
| 46 | Seguimiento de pedidos o vuelos mediante integraciones disponibles. | pendiente | Faltan proveedor, autorización y contrato de datos. No se realizan consultas ni compras. |
| 47 | Arrastrar archivos a la isla. | limitado por plataforma | Actualmente se utiliza copiar/pegar archivos; DND externo en Wayland necesita un puente de aplicación/portal probado. |
| 48 | Bandeja temporal de archivos. | funcional | Bandeja persistente de rutas, copiar, abrir, enviar y retirar sin borrar originales. |
| 49 | Arrastrar archivos desde la isla hacia destinos compatibles. | limitado por plataforma | Actualmente se utiliza copiar/pegar archivos; DND externo en Wayland necesita un puente de aplicación/portal probado. |
| 50 | Vista previa de archivos. | en desarrollo | Apertura con aplicación predeterminada; vista previa embebida pendiente. |
| 51 | Selección múltiple. | probado | Selección de bandeja utilizada por la prueba de ZIP desde GNOME. |
| 52 | Compresión ZIP. | probado | ZIP/extracción, rechazo de rutas externas, PNG, MP3, MP4 y OCR con fixtures locales. |
| 53 | Extracción de archivos. | probado | ZIP/extracción, rechazo de rutas externas, PNG, MP3, MP4 y OCR con fixtures locales. |
| 54 | Conversión de imágenes. | probado | ZIP/extracción, rechazo de rutas externas, PNG, MP3, MP4 y OCR con fixtures locales. |
| 55 | Conversión de audio y video mediante FFmpeg. | probado | ZIP/extracción, rechazo de rutas externas, PNG, MP3, MP4 y OCR con fixtures locales. |
| 56 | Eliminación de fondos con una herramienta local opcional. | pendiente | rembg no está instalado; no se descargaron modelos. |
| 57 | Reconocimiento OCR de texto. | probado | ZIP/extracción, rechazo de rutas externas, PNG, MP3, MP4 y OCR con fixtures locales. |
| 58 | Historial de textos copiados. | funcional | Historial existente de texto/imagen, búsqueda, fijados y borrado. Nuevas instalaciones inician en modo privado. |
| 59 | Historial de imágenes copiadas. | funcional | Historial existente de texto/imagen, búsqueda, fijados y borrado. Nuevas instalaciones inician en modo privado. |
| 60 | Buscar y fijar elementos del portapapeles. | funcional | Historial existente de texto/imagen, búsqueda, fijados y borrado. Nuevas instalaciones inician en modo privado. |
| 61 | Progreso de descargas de aplicaciones compatibles. | pendiente | Falta integrar protocolos de progreso de navegadores/gestores de descargas; no se inventa progreso. |
| 62 | Compartir archivos mediante LocalSend. | limitado por plataforma | Lanzamiento opcional de LocalSend/KDE Connect/Bluetooth si están instalados; no implementa AirDrop. |
| 63 | Para la transferencia tipo AirDrop, utilizar una alternativa Linux compatible en lugar de intentar acceder al protocolo propietario de Apple. | limitado por plataforma | Lanzamiento opcional de LocalSend/KDE Connect/Bluetooth si están instalados; no implementa AirDrop. |
| 64 | Calendario mensual y semanal. | probado | Calendario mensual y semanal nativo; capturas reales de alineación. |
| 65 | Eventos próximos. | funcional | Eventos del servidor de calendario GNOME, según cuentas configuradas. |
| 66 | Recordatorios. | en desarrollo | Tareas y temporizador disponibles; avisos programados por tarea pendientes. |
| 67 | Notas rápidas. | funcional | Notas existentes conservadas y guardadas localmente. |
| 68 | Lista de tareas. | funcional | Tareas persistentes, completar y eliminar; sin recordatorios por tarea aún. |
| 69 | Temporizador y cronómetro. | probado | Temporizador/cronómetro y restauración al desactivar/activar; no ejecuta alarmas con GNOME cerrado. |
| 70 | Pomodoro. | funcional | Ciclos Pomodoro manuales, alarma HH:MM mediante temporizador y cuatro relojes mundiales. |
| 71 | Alarmas. | funcional | Ciclos Pomodoro manuales, alarma HH:MM mediante temporizador y cuatro relojes mundiales. |
| 72 | Reloj mundial. | funcional | Ciclos Pomodoro manuales, alarma HH:MM mediante temporizador y cuatro relojes mundiales. |
| 73 | Modo de concentración propio. | funcional | Concentración cambia show-banners de GNOME; avisos respetan No molestar. |
| 74 | Integración con Google Calendar si se configura. | limitado por plataforma | Usa eventos que GNOME Calendar exponga mediante cuentas online; no incluye OAuth propio. |
| 75 | Cuenta regresiva para fechas importantes. | pendiente | Falta interfaz para fechas importantes; alarma HH:MM disponible. |
| 76 | Lanzador de aplicaciones. | funcional | Búsqueda y activación de aplicaciones instaladas vía Shell.AppSystem. |
| 77 | Comandos personalizados configurados explícitamente por el usuario. | pendiente | No se ejecutan comandos arbitrarios ni se incorpora una terminal; requiere configuración explícita y módulo dedicado. |
| 78 | Terminal integrada o terminal auxiliar. | pendiente | No se ejecutan comandos arbitrarios ni se incorpora una terminal; requiere configuración explícita y módulo dedicado. |
| 79 | Búsqueda de aplicaciones y archivos. | en desarrollo | Busca aplicaciones y archivos de la bandeja; no indexa todo el equipo. |
| 80 | Traductor de textos. | pendiente | Requiere motor local o proveedor elegido por el usuario. |
| 81 | Vista de cámara como espejo. | limitado por plataforma | Espejo auxiliar GStreamer conservado, explícito y temporal; no es una cámara embebida en St. |
| 82 | Selector de cámara. | pendiente | Actualmente usa /dev/video0; selector pendiente. |
| 83 | Capturas de pantalla. | funcional | Abre interfaces nativas de GNOME para que el usuario seleccione y confirme captura/grabación. |
| 84 | Grabación de pantalla autorizada. | funcional | Abre interfaces nativas de GNOME para que el usuario seleccione y confirme captura/grabación. |
| 85 | Indicador de grabación. | funcional | Señal nativa screencast-in-progress; indicador de duración desde que se observa el inicio. |
| 86 | Selector de color, con permisos adecuados. | pendiente | Falta selector de color con la interacción nativa correspondiente. |
| 87 | Generador y lector QR. | pendiente | qrencode y zbarimg no instalados; no se muestran acciones decorativas. |
| 88 | Historial de capturas creadas por la isla. | en desarrollo | Historial de hasta cinco capturas iniciadas desde la isla, solo durante la sesión. |
| 89 | Grabación y transcripción de voz. | pendiente | Falta motor de transcripción y flujo de consentimiento del micrófono. |
| 90 | Acceso a ajustes de pantalla. | funcional | Acceso explícito a los ajustes nativos de pantalla. |
| 91 | Control temporal de suspensión o inhibición de pantalla mediante mecanismos compatibles. | funcional | Inhibición temporal de sesión conservada; se libera en disable. |
| 92 | Vista previa de ventanas cuando la API lo permita. | pendiente | Vista previa de ventanas aún no incorporada. |
| 93 | Expansión al pasar el cursor. | funcional | Hover configurable con demora y cierre al salir cuando la apertura fue por hover. |
| 94 | Expansión mediante clic. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 95 | Contracción automática. | funcional | Hover configurable con demora y cierre al salir cuando la apertura fue por hover. |
| 96 | Animaciones de apertura y cierre. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 97 | Navegación mediante gestos compatibles. | funcional | Rueda sobre pestañas y Alt+flechas; no implementa gestos multitáctiles globales. |
| 98 | Atajos de teclado. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 99 | Dimensiones configurables. | pendiente | Ancho actual 428 px lógicos y altura adaptativa; personalización de dimensiones pendiente. |
| 100 | Temas, colores y transparencias. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 101 | Apple Glass, Apple Dark y otros temas existentes. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 102 | Acento automático basado en portadas musicales. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 103 | Ocultar controles no disponibles. | funcional | Capacidades MPRIS deshabilitan acciones; brillo/teclado se ocultan si no están disponibles. |
| 104 | Animaciones de notificaciones. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 105 | Gestión de varias actividades en vivo. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 106 | Configuración por monitor compatible. | en desarrollo | Centrado y reacción a cambios de monitores en monitor principal; selección por monitor pendiente. |
| 107 | Comportamiento especial ante pantalla completa. | funcional | Preferencia de ocultación en pantalla completa; falta validación con juegos reales. |
| 108 | Inicio automático con GNOME. | probado | Carga GNOME 50, apertura/cierre, pestañas, preferencias, color de portada y avisos comprobados en sesión aislada. |
| 109 | Integración con No molestar o un estado equivalente compatible. | funcional | Concentración cambia show-banners de GNOME; avisos respetan No molestar. |
| 110 | Soporte de pantalla de bloqueo solo si existe una implementación segura y compatible; no modifiques componentes de seguridad de GNOME para forzarlo. | limitado por plataforma | Solo sesión de usuario. No se altera la seguridad ni la pantalla de bloqueo. |

