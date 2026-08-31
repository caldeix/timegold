/* TiempoEsOro - Semilla inicial.
 *
 * Se carga con <script>, NO con fetch(): desde file:// el navegador asigna
 * origen "null" y bloquea fetch por CORS. Un <script> normal si funciona.
 *
 * Solo se usa la PRIMERA vez, cuando localStorage esta vacio. A partir de ahi
 * el almacen vivo es localStorage y este archivo queda de reserva.
 *
 * Time-blocking estricto: si no esta en la matriz, no existe. Todas las horas
 * que se restan de las 168 tienen un sitio concreto en el calendario.
 *
 * Cuadre de esta semilla:
 *   Sueno 56 + Trabajo 40 + Universidad 7,5 + Nutricion 10,5
 *   + Entrenamiento 4,5 + Cryptos 3  =  121,5 h ocupadas
 *   Tiempo Libre = 168 - 121,5 = 46,5 h
 */
window.DATOS_SEMILLA = {
  version: 1,
  actualizado: null,
  actividades: [
    {
      id: 'act_semilla_sueno',
      nombre: 'Sueño',
      color: '#4a6fa5',
      icono: 'cat-sleep',
      activa: true,
      // Cruza medianoche: 23:00 -> 07:00 continua en el dia siguiente.
      bloques: [
        { dias: [0, 1, 2, 3, 4, 5, 6], desde: '23:00', hasta: '07:00' }
      ]
    },
    {
      id: 'act_semilla_trabajo',
      nombre: 'Trabajo',
      color: '#c2703d',
      icono: 'cat-work',
      activa: true,
      bloques: [
        { dias: [0, 1, 2, 3, 4], desde: '09:00', hasta: '14:00' },
        { dias: [0, 1, 2, 3, 4], desde: '15:00', hasta: '18:00' }
      ]
    },
    {
      id: 'act_semilla_universidad',
      nombre: 'Universidad',
      color: '#7a5ea8',
      icono: 'cat-university',
      activa: true,
      bloques: [
        { dias: [0, 2, 4], desde: '19:00', hasta: '21:30' }
      ]
    },
    {
      id: 'act_semilla_nutricion',
      nombre: 'Reset & Nutrición',
      color: '#3f8f6b',
      icono: 'cat-nutrition',
      activa: true,
      bloques: [
        { dias: [0, 1, 2, 3, 4, 5, 6], desde: '08:00', hasta: '08:30' },
        { dias: [0, 1, 2, 3, 4, 5, 6], desde: '14:00', hasta: '15:00' }
      ]
    },
    {
      id: 'act_semilla_entrenamiento',
      nombre: 'Entrenamiento',
      color: '#c0504d',
      icono: 'cat-training',
      activa: true,
      bloques: [
        { dias: [1, 3, 5], desde: '18:30', hasta: '20:00' }
      ]
    },
    {
      id: 'act_semilla_cryptos',
      nombre: 'Estudio Cryptos',
      color: '#c9a227',
      icono: 'cat-crypto',
      activa: true,
      bloques: [
        { dias: [5, 6], desde: '10:00', hasta: '11:30' }
      ]
    }
  ]
};
