import * as clima from './clima.js';
import * as calendario from './calendario.js';
import * as reloj from './reloj.js';
import * as baterias from './baterias.js';
import * as recordatorios from './recordatorios.js';
import * as notas from './notas.js';
import * as fotos from './fotos.js';
import * as musica from './musica.js';
import * as podcasts from './podcasts.js';
import * as contactos from './contactos.js';
import * as buscar from './buscar.js';
import * as noticias from './noticias.js';
import * as tiempouso from './tiempouso.js';

// Orden de la galería «Añadir widget».
export const LISTA = [clima, calendario, reloj, baterias, recordatorios, notas, fotos, musica,
    podcasts, contactos, buscar, noticias, tiempouso];
export const MODULOS = Object.fromEntries(LISTA.map(m => [m.META.id, m]));
