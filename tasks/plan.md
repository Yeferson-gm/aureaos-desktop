# Aurea 27: consolidación

## Objetivo

Un solo repositorio local para el escritorio personalizado, con tema completo,
extensiones, pruebas y documentación. Punto inicial público del stack: etiqueta
Git `v0.0.1`. Sin publicación remota ni reinicio forzado de sesión.

## Decisiones

- `theme/` contiene todo el tema: GTK 2/3/4, Shell, decoraciones, iconos completos,
  cursores y la personalización GTK4 activa. Las carpetas cyan forman parte del
  tema de iconos completo, no un paquete independiente.
- `extensions/` contiene barra, dock, isla superior, isla lateral, widgets,
  fondo animado, iconos del escritorio y centro de aplicaciones.
- `integrations/` conserva pruebas y configuraciones auxiliares sin datos privados.
- La marca visible es Aurea 27. Los UUID, D-Bus y esquemas existentes se conservan
  como identificadores de compatibilidad: cambiarlos borraría la asociación de
  preferencias y rompería integraciones entre extensiones. No son versiones.
- La versión de distribución procede de etiquetas Git. Los metadatos generados
  incluyen `version-name` semántico y el entero que exige GNOME.
- Los comentarios explicativos pasan a Markdown con referencia a su archivo.
  Se preservan las instrucciones interpretadas por herramientas y los avisos
  legales obligatorios; no se elimina la autoría de los proyectos de origen.
- Se conservan los objetos Git anteriores de la isla en referencias de archivo.
- Las copias instaladas siguen separadas del código fuente porque GNOME las necesita.
  La consolidación no convierte el directorio de desarrollo en datos de ejecución.

## Secuencia

1. Inventariar y comparar las fuentes con las instalaciones.
2. Importar el contenido completo y registrar una instantánea Git recuperable.
3. Unificar nombres, versión derivada de Git y empaquetado sin fuentes duplicadas.
4. Trasladar comentarios a documentación sin cambiar los tokens ejecutables.
5. Verificar enlaces, esquemas, sintaxis, pruebas de regresión y Shell aislado.
6. Crear la etiqueta inicial, preparar el paquete e instalar las marcas verificadas.
7. Retirar las antiguas carpetas de desarrollo solo después de verificar su importación.

## Riesgos

No se incluirán imágenes personales, vídeos, notas, contactos, credenciales ni
historiales. Los enlaces del tema deben quedar dentro de la familia Aurea 27.
Las licencias originales y las versiones de protocolos/dependencias no se
confunden con la versión del stack. Los cambios de Shell necesitan otra sesión.

## Verificación

Comparación por hash de la importación, análisis sintáctico de los archivos,
validación de enlaces del tema, esquema de cada extensión, pruebas existentes
adaptadas a rutas relativas y sesiones GNOME aisladas. Árbol Git limpio al final.
