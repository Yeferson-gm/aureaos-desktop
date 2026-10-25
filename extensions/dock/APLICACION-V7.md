# Parche v7 aplicado — 2026-10-25

Se revisó el adjunto completo y se aplicó primero a una copia de la extensión
instalada. Todas las anclas del parche coincidieron. Se compilaron los esquemas
y se probó el dock en GNOME Shell aislado: carga, ampliación, vidrio y retorno
a escala/posición inicial correctos.

Se conservaron `click-action=minimize` y la ocultación automática, en lugar de
aplicar `focus-or-previews` del parche. Se aplicaron vidrio, desenfoque 34,
rebote, punto único, ampliación 1.75 y respuesta 70 ms, con aplicaciones al
principio. La ampliación v7 desplaza vecinos lateralmente según el parche.

Fuentes, extensión instalada e instalador autocontenido actualizados a v7.
El código nuevo se carga al volver a iniciar sesión; no se cerraron apps.

Respaldo de fuentes e instalación anterior:
`/home/yefersongm/Respaldos-GNOME/dock-v7-q3Wfxq6h/`.
Preferencias previas guardadas por el parche en
`/home/yefersongm/.local/state/macos27-dock/backups/parche-v7-20261025-110126/ajustes.dconf`.
