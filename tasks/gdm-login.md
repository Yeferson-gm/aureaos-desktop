# Corregir la pantalla de acceso de GDM

El usuario confirmó que la pantalla sin personalizar era la de encendido/cierre
de sesión. Aurea lock-screen está ACTIVE; no es un fallo de esa extensión.

1. Verificar separación entre GDM y bloqueo de sesión y contratos GNOME 50.6.
2. Preparar tema de GDM conservando recursos nativos y alto contraste.
3. Probar instalación/restauración, idempotencia, rechazo de respaldo dañado,
   rollback y formulario protegido nativo en Shell aislado.
4. Integrar construcción, documentación y Git.
5. Aplicar con autorización administrativa del sistema, verificar checksum y
   no reiniciar GDM ni cerrar la sesión habitual.

Pasos 1–4 preparados: pruebas de transacción y restauración (4 casos), validación
completa del repositorio y prueba del AuthPrompt/PasswordEntry real con verificador
sintético. La previsualización privada confirma el fondo, radios, texto y errores.
La aplicación al sistema requiere autenticación administrativa mediante PolicyKit.
