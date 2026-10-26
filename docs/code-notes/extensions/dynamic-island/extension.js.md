# Notas de extensions/dynamic-island/extension.js

Comentarios trasladados durante la consolidación. Los números corresponden al archivo antes del traslado.

## Línea 19

````text
// ======================= AJUSTES =======================
````

## Línea 20

````text
// oculta el cartel de volumen/brillo de GNOME y usa el notch
````

## Línea 21

````text
// ej: {nombre: 'Lima', lat: -12.04, lon: -77.03}  (null = detectar sola)
````

## Línea 23

````text
// ancho visible del nombre en el notch
````

## Línea 24

````text
// píxeles por segundo
````

## Línea 25

````text
// =======================================================
````

## Línea 36

````text
// Mantener el espacio interior del panel expandido.
````

## Línea 107

````text
// =====================================================================
````

## Línea 108

````text
//  Ciclo de vida
````

## Línea 109

````text
// =====================================================================
````

## Línea 139

````text
// música
````

## Línea 159

````text
// sistema
````

## Línea 177

````text
// pill / toast
````

## Línea 182

````text
// productividad
````

## Línea 207

````text
// reloj
````

## Línea 213

````text
// hoy
````

## Línea 292

````text
// soltar el bloqueo de "mantener despierto"
````

## Línea 297

````text
/* nada */
````

## Línea 308

````text
/* nada */
````

## Línea 320

````text
/* nada */
````

## Línea 325

````text
/* nada */
````

## Línea 326

````text
/* nada */
````

## Línea 332

````text
/* nada */
````

## Línea 337

````text
/* nada */
````

## Línea 355

````text
// =====================================================================
````

## Línea 356

````text
//  Utilidades
````

## Línea 357

````text
// =====================================================================
````

## Línea 513

````text
// =====================================================================
````

## Línea 514

````text
//  Notch (píldora del panel) + avisos (HUD)
````

## Línea 515

````text
// =====================================================================
````

## Línea 583

````text
// Abrir después de soltar el puntero. Durante button-press-event el
````

## Línea 584

````text
// botón del panel aún conserva el grab y GNOME rechaza el grab modal
````

## Línea 585

````text
// de la isla, por lo que ésta se ocultaba inmediatamente.
````

## Línea 635

````text
// Geometría de la isla lateral rotada al borde superior. Los hombros
````

## Línea 636

````text
// cóncavos conservan la unión a la pantalla durante toda la expansión.
````

## Línea 651

````text
// Rellenar cierra el contorno; dejar el trazo abierto evita una línea
````

## Línea 652

````text
// horizontal sobre el borde de la pantalla, igual que la isla lateral.
````

## Línea 664

````text
// El notch ocupa todo el alto del panel, pegado al borde superior, como en un Mac.
````

## Línea 726

````text
// Repartir el espacio de la antigua portada entre ambos márgenes:
````

## Línea 727

````text
// mantiene márgenes equilibrados sin cargar ninguna imagen aquí.
````

## Línea 750

````text
// Indica reproducción, no amplitud de audio: no se fabrican muestras de sonido.
````

## Línea 811

````text
// =====================================================================
````

## Línea 812

````text
//  Tarjeta: pestañas
````

## Línea 813

````text
// =====================================================================
````

## Línea 828

````text
// La isla es una sola pieza negra pegada al borde superior que crece desde el notch.
````

## Línea 844

````text
// barra de pestañas
````

## Línea 953

````text
// ---------- Apertura / cierre: el notch crece hacia abajo ----------
````

## Línea 1011

````text
// la animación de apertura ya usa la nueva altura
````

## Línea 1071

````text
/* prueba sintética */
````

## Línea 1074

````text
// clic fuera de la isla, o sobre la zona del notch: se cierra
````

## Línea 1077

````text
// Este primer clic sólo descarta la isla. Propagarlo activaría el
````

## Línea 1078

````text
// control o la ventana que quede debajo y se percibiría como un
````

## Línea 1079

````text
// clic fantasma.
````

## Línea 1088

````text
// Igual que PopupMenuManager de GNOME: el grab hace que los clics
````

## Línea 1089

````text
// sobre clientes Wayland lleguen al actor de la isla.
````

## Línea 1107

````text
/* nada */
````

## Línea 1120

````text
// Liberar la entrada antes de cualquier limpieza que pueda fallar.
````

## Línea 1121

````text
// También recupera un grab residual si el estado ya cambió a cerrado.
````

## Línea 1265

````text
// =====================================================================
````

## Línea 1266

````text
//  Página: Música
````

## Línea 1267

````text
// =====================================================================
````

## Línea 1449

````text
// =====================================================================
````

## Línea 1450

````text
//  Página: Estante de archivos
````

## Línea 1451

````text
// =====================================================================
````

## Línea 1531

````text
/* nada */
````

## Línea 1550

````text
/* nada */
````

## Línea 1563

````text
/* nada */
````

## Línea 1600

````text
/* nada */
````

## Línea 1645

````text
// Equivalente a AirDrop en Linux: KDE Connect o Bluetooth.
````

## Línea 1651

````text
// =====================================================================
````

## Línea 1652

````text
//  Página: Portapapeles (historial con texto e imágenes)
````

## Línea 1653

````text
// =====================================================================
````

## Línea 1672

````text
/* primera vez */
````

## Línea 1714

````text
/* nada */
````

## Línea 1723

````text
/* nada */
````

## Línea 1747

````text
/* nada */
````

## Línea 1754

````text
/* cae a texto */
````

## Línea 1769

````text
// limitar historial (fijados y favoritos nunca se borran solos)
````

## Línea 1811

````text
/* nada */
````

## Línea 1829

````text
// La lista conserva su orden: solo se mueve el punto naranja hasta la copia elegida.
````

## Línea 1892

````text
// ancho fijo para que el texto quede a la izquierda y el interruptor a la derecha
````

## Línea 1988

````text
/* la fila ya no existe */
````

## Línea 2076

````text
// =====================================================================
````

## Línea 2077

````text
//  Página: Notas rápidas
````

## Línea 2078

````text
// =====================================================================
````

## Línea 2121

````text
/* primera ejecución */
````

## Línea 2161

````text
/* aún no hay notas */
````

## Línea 2166

````text
/* nada */
````

## Línea 2169

````text
// =====================================================================
````

## Línea 2170

````text
//  Página: Notificaciones nativas de GNOME
````

## Línea 2171

````text
// =====================================================================
````

## Línea 2193

````text
// Interceptar la presentación, no la entrega ni las preferencias globales.
````

## Línea 2194

````text
// _showNotification se consulta al mostrar; interceptar la señal ya
````

## Línea 2195

````text
// enlazada de cada fuente no cubriría las aplicaciones existentes.
````

## Línea 2202

````text
// No reproducir banners atrasados ni dejar visible uno anterior.
````

## Línea 2237

````text
/* fuente eliminada durante la actualización */
````

## Línea 2251

````text
/* notificación transitoria */
````

## Línea 2325

````text
/* conservar icono genérico */
````

## Línea 2343

````text
/* algunas notificaciones no son activables */
````

## Línea 2352

````text
/* ya eliminada */
````

## Línea 2357

````text
// =====================================================================
````

## Línea 2358

````text
//  Página: Sistema (CPU, RAM, batería, brillo, mantener despierto)
````

## Línea 2359

````text
// =====================================================================
````

## Línea 2503

````text
/* nada */
````

## Línea 2514

````text
/* nada */
````

## Línea 2562

````text
// ---------- mantener despierto ----------
````

## Línea 2609

````text
// =====================================================================
````

## Línea 2610

````text
//  Volumen del sistema + HUD
````

## Línea 2611

````text
// =====================================================================
````

## Línea 2625

````text
/* nada */
````

## Línea 2688

````text
/* nada */
````

## Línea 2693

````text
// =====================================================================
````

## Línea 2694

````text
//  Brillo
````

## Línea 2695

````text
// =====================================================================
````

## Línea 2724

````text
// =====================================================================
````

## Línea 2725

````text
//  Batería
````

## Línea 2726

````text
// =====================================================================
````

## Línea 2778

````text
// =====================================================================
````

## Línea 2779

````text
//  Bluetooth (AirPods y otros)
````

## Línea 2780

````text
// =====================================================================
````

## Línea 2806

````text
// GetManagedObjects siempre se consulta en el bus de sistema.
````

## Línea 2861

````text
// =====================================================================
````

## Línea 2862

````text
//  Página: Temporizador / Cronómetro
````

## Línea 2863

````text
// =====================================================================
````

## Línea 3000

````text
/* nada */
````

## Línea 3019

````text
// contador visible siempre en el notch
````

## Línea 3056

````text
/* aún no hay temporizador guardado */
````

## Línea 3059

````text
// =====================================================================
````

## Línea 3060

````text
//  Página: Hoy (calendario + clima)
````

## Línea 3061

````text
// =====================================================================
````

## Línea 3278

````text
// =====================================================================
````

## Línea 3279

````text
//  Página: Espejo (cámara)
````

## Línea 3280

````text
// =====================================================================
````

## Línea 3331

````text
/* nada */
````

## Línea 3360

````text
/* nada */
````

## Línea 3361

````text
/* nada */
````

## Línea 3365

````text
// =====================================================================
````

## Línea 3366

````text
//  Música: D-Bus
````

## Línea 3367

````text
// =====================================================================
````

## Línea 3386

````text
/* el reproductor puede cerrarse durante el descubrimiento */
````

## Línea 3563

````text
/* Portada inválida: conservar la superficie neutra. */
````
