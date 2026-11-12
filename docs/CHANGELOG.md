# Cambios

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
