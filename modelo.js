/* TiempoEsOro - Nucleo de calculo. NO toca el DOM ni localStorage.
 *
 * Todo se apoya en una rejilla de medias horas:
 *   rejilla[dia][slot] = [ {id, dur}, ... ]   // 7 dias x 48 slots, 0..2 ocupantes
 *
 * Regla central de las 168 h (tiempo de reloj):
 *   una franja ocupada cuenta UNA vez, la solapen una o dos actividades.
 *   Escaparte 30 min dentro de un tiempo ya comprometido no cuesta 30 min mas.
 */
(function (global) {
  'use strict';

  var DIAS = 7;
  var SLOTS_DIA = 48;                 // 48 medias horas
  var HORAS_SEMANA = DIAS * 24;       // 168, inmutable
  var MAX_OCUPANTES = 2;              // nunca mas de dos actividades por franja

  var NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  var ABREV_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /* "17:30" -> 35 */
  function aSlot(hhmm) {
    var p = String(hhmm || '').split(':');
    var h = parseInt(p[0], 10) || 0;
    var m = parseInt(p[1], 10) || 0;
    return (h * 2) + (m >= 30 ? 1 : 0);
  }

  /* 35 -> "17:30" */
  function aHora(slot) {
    var s = ((slot % SLOTS_DIA) + SLOTS_DIA) % SLOTS_DIA;
    var h = Math.floor(s / 2);
    return (h < 10 ? '0' : '') + h + (s % 2 ? ':30' : ':00');
  }

  /* Duracion de un bloque en slots. Si hasta <= desde, cruza medianoche. */
  function duracionSlots(bloque) {
    var ini = aSlot(bloque.desde);
    var fin = aSlot(bloque.hasta);
    return fin > ini ? fin - ini : (SLOTS_DIA - ini) + fin;
  }

  function horasBloque(bloque) {
    return duracionSlots(bloque) * 0.5 * ((bloque.dias || []).length);
  }

  /* Expande un bloque a sus posiciones absolutas. El desbordamiento pasado
     medianoche cae en el dia siguiente: (dia + 1) % 7. */
  function slotsDeBloque(bloque) {
    var dur = duracionSlots(bloque);
    var ini = aSlot(bloque.desde);
    var out = [];
    (bloque.dias || []).forEach(function (d0) {
      for (var i = 0; i < dur; i++) {
        var abs = ini + i;
        out.push({
          dia: (d0 + Math.floor(abs / SLOTS_DIA)) % DIAS,
          slot: abs % SLOTS_DIA,
          dur: dur
        });
      }
    });
    return out;
  }

  function esActiva(a) {
    return a && a.activa !== false;
  }

  function rejillaVacia() {
    var r = [];
    for (var d = 0; d < DIAS; d++) {
      r.push([]);
      for (var s = 0; s < SLOTS_DIA; s++) r[d].push([]);
    }
    return r;
  }

  /* Construye la rejilla SIN aplicar el limite de 2: el exceso se detecta
     despues con conflictos(), para poder informar de donde esta el problema. */
  function construirRejilla(actividades) {
    var rej = rejillaVacia();
    (actividades || []).filter(esActiva).forEach(function (a) {
      (a.bloques || []).forEach(function (b) {
        slotsDeBloque(b).forEach(function (pos) {
          var celda = rej[pos.dia][pos.slot];
          var ya = celda.some(function (o) { return o.id === a.id; });
          if (!ya) celda.push({ id: a.id, dur: pos.dur });
        });
      });
    });
    return rej;
  }

  /* Franjas que superan MAX_OCUPANTES, agrupadas en rangos contiguos
     para poder decir "Lunes 10:00-11:00" en vez de listar slot a slot. */
  function conflictos(rej) {
    var out = [];
    for (var d = 0; d < DIAS; d++) {
      var ini = -1;
      for (var s = 0; s <= SLOTS_DIA; s++) {
        var malo = s < SLOTS_DIA && rej[d][s].length > MAX_OCUPANTES;
        if (malo && ini === -1) ini = s;
        if (!malo && ini !== -1) {
          out.push({ dia: d, desde: aHora(ini), hasta: aHora(s), ids: rej[d][ini].map(function (o) { return o.id; }) });
          ini = -1;
        }
      }
    }
    return out;
  }

  /* Ocupantes de un slot ordenados para pintar: el bloque MAS LARGO primero,
     que es el que va al fondo (triangulo inferior izquierdo). */
  function ocupantesOrdenados(celda) {
    return celda.slice().sort(function (x, y) { return y.dur - x.dur; });
  }

  /* Tramos contiguos por actividad, para que el tooltip diga el rango COMPLETO
     ("18:00 - 20:30") en vez de la media hora concreta sobre la que esta el raton.
   *
   * La semana se recorre como una secuencia circular de 336 posiciones
   * (dia * 48 + slot), de modo que un bloque que cruza medianoche -o el domingo
   * hacia el lunes- sale como UN solo tramo y no como dos.
   *
   * Devuelve un mapa: "posicion|idActividad" -> { ini, fin }  (fin exclusivo).
   */
  function tramos(rej) {
    var TOTAL = DIAS * SLOTS_DIA;
    var mapa = {};

    var ids = {};
    for (var p = 0; p < TOTAL; p++) {
      rej[Math.floor(p / SLOTS_DIA)][p % SLOTS_DIA].forEach(function (o) { ids[o.id] = true; });
    }

    Object.keys(ids).forEach(function (id) {
      var ocupa = [];
      for (var q = 0; q < TOTAL; q++) {
        ocupa.push(rej[Math.floor(q / SLOTS_DIA)][q % SLOTS_DIA].some(function (o) {
          return o.id === id;
        }));
      }

      var hueco = ocupa.indexOf(false);
      if (hueco === -1) {                       // ocupa la semana entera
        for (var r = 0; r < TOTAL; r++) mapa[r + '|' + id] = { ini: 0, fin: 0, completo: true };
        return;
      }

      // Se arranca desde un hueco para no partir un tramo por la mitad.
      var pos = hueco, vistos = 0;
      while (vistos < TOTAL) {
        if (!ocupa[pos]) { pos = (pos + 1) % TOTAL; vistos++; continue; }
        var ini = pos, largo = 0;
        while (ocupa[pos] && largo < TOTAL) {
          pos = (pos + 1) % TOTAL;
          largo++;
          vistos++;
        }
        for (var k = 0; k < largo; k++) {
          mapa[((ini + k) % TOTAL) + '|' + id] = { ini: ini, fin: pos };
        }
      }
    });

    return mapa;
  }

  /* Cuadre completo de la semana. */
  function calcular(actividades) {
    var lista = actividades || [];
    var rej = construirRejilla(lista);

    var porActividad = {};
    lista.forEach(function (a) {
      porActividad[a.id] = {
        horasFijas: 0,
        activa: esActiva(a)
      };
    });

    var slotsOcupados = 0;
    var slotsSolapados = 0;

    for (var d = 0; d < DIAS; d++) {
      for (var s = 0; s < SLOTS_DIA; s++) {
        var celda = rej[d][s];
        if (celda.length >= 1) slotsOcupados++;
        if (celda.length >= 2) slotsSolapados++;
        celda.forEach(function (o) {
          if (porActividad[o.id]) porActividad[o.id].horasFijas += 0.5;
        });
      }
    }

    var horasReloj = slotsOcupados * 0.5;
    var horasSolapadas = slotsSolapados * 0.5;

    // Las 168 h cuadran siempre: el reloj no se estira por solapar.
    // Time-blocking estricto: si no esta en la matriz, no existe.
    var tiempoLibre = HORAS_SEMANA - horasReloj;

    return {
      rejilla: rej,
      tramos: tramos(rej),
      porActividad: porActividad,
      horasReloj: horasReloj,
      horasSolapadas: horasSolapadas,
      tiempoLibre: tiempoLibre,
      conflictos: conflictos(rej)
    };
  }

  /* "8", "7,5" -> texto corto en horas. */
  function formatHoras(h) {
    var n = Math.round(h * 10) / 10;
    return (n % 1 === 0 ? String(n) : n.toFixed(1).replace('.', ',')) + ' h';
  }

  /* Resumen legible de los bloques de una actividad, para la tabla. */
  function describirBloques(a) {
    var bs = (a.bloques || []).filter(function (b) { return (b.dias || []).length; });
    if (!bs.length) return 'Sin horario asignado';
    return bs.map(function (b) {
      var dias = b.dias.slice().sort(function (x, y) { return x - y; })
        .map(function (d) { return ABREV_DIA[d]; }).join('');
      return dias + ' ' + b.desde + '-' + b.hasta;
    }).join('  ·  ');
  }

  global.Modelo = {
    DIAS: DIAS,
    SLOTS_DIA: SLOTS_DIA,
    HORAS_SEMANA: HORAS_SEMANA,
    MAX_OCUPANTES: MAX_OCUPANTES,
    NOMBRES_DIA: NOMBRES_DIA,
    ABREV_DIA: ABREV_DIA,
    aSlot: aSlot,
    aHora: aHora,
    duracionSlots: duracionSlots,
    horasBloque: horasBloque,
    slotsDeBloque: slotsDeBloque,
    construirRejilla: construirRejilla,
    conflictos: conflictos,
    ocupantesOrdenados: ocupantesOrdenados,
    tramos: tramos,
    calcular: calcular,
    formatHoras: formatHoras,
    describirBloques: describirBloques
  };
})(window);
