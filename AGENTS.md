# Desarrollo de Aurea 27

- Leer `README.md`, `docs/arquitectura.md` y el plan vigente antes de modificar.
- Editar aquí, no directamente en las instalaciones GNOME.
- Una sola fuente por componente; no reconstruir instaladores con código duplicado.
- Versionar entregas con etiquetas Git; no poner versiones del producto en código
  ni `metadata.json` de fuente. No mover etiquetas publicadas.
- Los comentarios explicativos pertenecen a Markdown. Preservar licencias,
  atribuciones y directivas funcionales. No eliminar docstrings o cadenas sin
  comprobar si tienen uso en ejecución.
- UUID, esquemas, gettext, D-Bus y formatos persistentes son contratos. Cualquier
  cambio necesita migración explícita y pruebas de compatibilidad.
- No incluir archivos personales, fotos, vídeos, notas, contactos, historial o
  credenciales. Los recursos sintéticos de prueba se generan en `/tmp`.
- Ejecutar `./aurea.sh check` y las pruebas aisladas del componente afectado.
- Nunca usar control inseguro de Shell, reiniciar GNOME ni cerrar sesión en el
  escritorio habitual para probar. Los drivers solo funcionan en la sesión aislada.
- No actualizar dependencias ni modificar diseños ajenos al cambio solicitado.
- Conservar licencias y procedencia; no publicar hasta resolver los permisos
  señalados en `docs/procedencia.md`.
