/* TiempoEsOro - Interfaz: render del resumen y la matriz, modal y eventos.
 *
 * Nunca habla con localStorage directamente (eso es cosa de store.js) ni calcula
 * horas por su cuenta (eso es cosa de modelo.js).
 */
(function () {
  'use strict';

  var DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  var DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  var DIAS_INICIAL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  var PALETA = ['#4a6fa5', '#c2703d', '#7a5ea8', '#3f8f6b', '#c0504d',
    '#c9a227', '#3d8ba8', '#a85e8c', '#6b8f3f', '#a8683d'];

  /* Hora por la que arranca la matriz. Las anteriores se van al final:
     con 6 el orden es 06:00 … 23:00, 00:00 … 05:00.
     Solo afecta al PINTADO; el modelo sigue indexando por hora real. */
  var HORA_INICIO = 6;

  /* ---------------------------------------------------------------- */
  /* Traduccion entre el dia de las CASILLAS y el dia NATURAL           */
  /*                                                                    */
  /* El dia de la app va de las 06:00 a las 05:30 del dia natural        */
  /* siguiente, igual que la matriz. Las casillas del modal usan ESA     */
  /* definicion: marcar "Viernes" con un bloque que empieza a las 00:30  */
  /* significa la NOCHE del viernes, que en el calendario es sabado.     */
  /*                                                                    */
  /* El modelo sigue guardando dias naturales; la conversion vive solo   */
  /* aqui, en la capa de interfaz, y es una biyeccion exacta.            */
  /* ---------------------------------------------------------------- */

  function esMadrugada(desde) {
    return Modelo.aSlot(desde) < HORA_INICIO * 2;
  }
  function aDiaNatural(d, desde) {          // casilla -> lo que se guarda
    return esMadrugada(desde) ? (d + 1) % Modelo.DIAS : d;
  }
  function aDiaCasilla(d, desde) {          // lo guardado -> casilla
    return esMadrugada(desde) ? (d - 1 + Modelo.DIAS) % Modelo.DIAS : d;
  }

  /* Frase en cristiano de lo que hace un bloque, para que no haya que
     deducir nada. Se recalcula en vivo al tocar dias u horas. */
  function resumenBloque(b) {
    if (!b.dias || !b.dias.length) return 'Marca al menos un día.';

    var dNat = b.dias.slice().sort(function (x, y) { return x - y; })[0];
    var dCas = aDiaCasilla(dNat, b.desde);
    var cruza = Modelo.aSlot(b.hasta) <= Modelo.aSlot(b.desde);
    var dFin = cruza ? (dNat + 1) % Modelo.DIAS : dNat;

    var horas = Modelo.formatHoras(Modelo.duracionSlots(b) * 0.5);
    var veces = b.dias.length > 1 ? '   ×' + b.dias.length + ' días' : '';
    var cabecera = (esMadrugada(b.desde) || cruza)
      ? 'Noche del ' + DIAS_LARGOS[dCas].toLowerCase() + ' → '
      : '';

    return cabecera + DIAS_CORTOS[dNat] + ' ' + b.desde
      + ' → ' + DIAS_CORTOS[dFin] + ' ' + b.hasta
      + '  (' + horas + ')' + veces;
  }

  var datos = null;      // estado vivo, el que se persiste
  var borrador = null;   // copia en edición mientras el modal está abierto
  var seleccion = null;  // id de la actividad seleccionada en el modal

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function icono(clave) {
    return (window.ICONOS && window.ICONOS[clave]) || '';
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  function nuevoId() {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ================================================================ */
  /* Render principal                                                  */
  /* ================================================================ */

  function render() {
    var calc = Modelo.calcular(datos.actividades);
    renderResumen(calc);
    renderMatriz(calc);
  }

  function renderResumen(calc) {
    var html = datos.actividades.map(function (a) {
      var p = calc.porActividad[a.id] || { horasFijas: 0 };
      return '<div class="fila' + (a.activa === false ? ' inactiva' : '') + '">'
        + '<div class="fila-color" style="background:' + esc(a.color) + '"></div>'
        + '<div class="fila-icono">' + icono(a.icono) + '</div>'
        + '<div class="fila-txt">'
        + '<span class="fila-nombre">' + esc(a.nombre) + '</span>'
        + '<span class="fila-detalle">' + esc(Modelo.describirBloques(a)) + '</span>'
        + '</div>'
        + '<div class="fila-horas">' + Modelo.formatHoras(p.horasFijas) + '</div>'
        + '</div>';
    }).join('');

    $('resumen-grid').innerHTML = html ||
      '<div class="vacio">Sin actividades todavía. Pulsa Configurar para crear la primera.</div>';

    // Sin actividades no hay nada que mirar: el boton Configurar reclama la atencion.
    $('btn-configurar').classList.toggle('reclama', datos.actividades.length === 0);

    $('libre-icono').innerHTML = icono('cat-free');

    var v = $('libre-valor');
    v.textContent = Modelo.formatHoras(calc.tiempoLibre);
    if (calc.tiempoLibre < 0) v.classList.add('negativo');
    else v.classList.remove('negativo');

    // Reconciliación visible: que la aritmética se pueda auditar de un vistazo.
    var partes = ['168 h − ocupado ' + Modelo.formatHoras(calc.horasReloj)];
    if (calc.horasSolapadas > 0) {
      partes.push('(' + Modelo.formatHoras(calc.horasSolapadas) + ' solapadas no restan dos veces)');
    }
    $('libre-nota').textContent = partes.join('  ');
  }

  function renderMatriz(calc) {
    var porId = {};
    datos.actividades.forEach(function (a) { porId[a.id] = a; });

    var out = ['<div class="mx-esq"></div>'];
    DIAS_CORTOS.forEach(function (d) {
      out.push('<div class="mx-dia">' + d + '</div>');
    });

    for (var i = 0; i < 24; i++) {
      var h = (HORA_INICIO + i) % 24;

      // Las filas que se fueron al final son la MADRUGADA DEL DIA SIGUIENTE.
      // El "dia" de una columna va de las 06:00 a las 05:30 del dia natural
      // siguiente: si te duermes el sabado a las 00:30, eso es la noche del
      // viernes y por tanto se pinta en la columna del viernes.
      var trasnoche = h < HORA_INICIO;
      var corte = (i > 0 && h === 0) ? ' mx-corte' : '';

      out.push('<div class="mx-hora' + corte + '">' + (h < 10 ? '0' : '') + h + ':00'
        + (trasnoche ? '<sup class="mx-sig">+1</sup>' : '') + '</div>');

      for (var d = 0; d < Modelo.DIAS; d++) {
        var dReal = trasnoche ? (d + 1) % Modelo.DIAS : d;
        out.push('<div class="mx-celda' + corte + '">');
        out.push(slotHtml(calc, porId, dReal, h * 2));
        out.push(slotHtml(calc, porId, dReal, h * 2 + 1));
        out.push('</div>');
      }
    }
    $('matriz').innerHTML = out.join('');
  }

  /* Rango legible de un tramo contiguo. Si empieza y acaba el mismo día se
     omite el segundo día: "Lunes 18:00 – 20:30". Si cruza la medianoche se
     nombran los dos: "Lunes 23:00 – Martes 07:00". */
  function etiquetaTramo(t) {
    if (!t) return '';
    if (t.completo) return 'toda la semana';
    var dIni = Math.floor(t.ini / Modelo.SLOTS_DIA) % Modelo.DIAS;
    var dFin = Math.floor(t.fin / Modelo.SLOTS_DIA) % Modelo.DIAS;
    var hIni = Modelo.aHora(t.ini % Modelo.SLOTS_DIA);
    var hFin = Modelo.aHora(t.fin % Modelo.SLOTS_DIA);
    return dIni === dFin
      ? DIAS_LARGOS[dIni] + ' ' + hIni + ' – ' + hFin
      : DIAS_LARGOS[dIni] + ' ' + hIni + ' – ' + DIAS_LARGOS[dFin] + ' ' + hFin;
  }

  /* Franja central de un tramo. El nombre se pinta UNA sola vez, en el medio,
   no en cada media hora: un bloque de 1,5 h son 3 franjas y el nombre va en
   la segunda. La semana es circular, asi que un tramo que cruza medianoche
   -o el domingo hacia el lunes- tiene un centro perfectamente definido. */
  function esCentroTramo(t, pos) {
    if (!t) return false;
    var TOTAL = Modelo.DIAS * Modelo.SLOTS_DIA;
    if (t.completo) return pos === 0;
    var largo = (t.fin - t.ini + TOTAL) % TOTAL;
    return pos === (t.ini + Math.floor(largo / 2)) % TOTAL;
  }

  /* Descripción de un ocupante: nombre + su tramo COMPLETO, no la media hora
     concreta sobre la que está el ratón. */
  function describirOcupante(calc, porId, pos, id) {
    var a = porId[id];
    return (a ? a.nombre : '?') + ' · ' + etiquetaTramo(calc.tramos[pos + '|' + id]);
  }

  function slotHtml(calc, porId, dia, slot) {
    var celda = calc.rejilla[dia][slot];
    if (!celda || !celda.length) return '<div class="slot"></div>';

    var pos = dia * Modelo.SLOTS_DIA + slot;
    var ord = Modelo.ocupantesOrdenados(celda);   // el bloque más largo primero
    var a1 = porId[ord[0].id];
    var c1 = (a1 && a1.color) || '#888888';
    var estilo;

    if (ord.length === 1) {
      estilo = 'background:' + c1;
    } else {
      var a2 = porId[ord[1].id];
      var c2 = (a2 && a2.color) || '#888888';
      // Mitad y mitad con separación vertical: el bloque más largo a la
      // izquierda, la excepción que se le superpone a la derecha.
      estilo = 'background:linear-gradient(to right,' + c1 + ' 0 50%,' + c2 + ' 50% 100%)';
    }

    var titulo = ord.map(function (o) {
      return describirOcupante(calc, porId, pos, o.id);
    }).join('\n');

    // Una etiqueta por ocupante y en el mismo orden que el degradado: el bloque
    // largo a la izquierda, el corto que lo interrumpe a la derecha.
    var etqs = ord.map(function (o) {
      if (!esCentroTramo(calc.tramos[pos + '|' + o.id], pos)) return '';
      var a = porId[o.id];
      return esc(a ? a.nombre : '?');
    });
    var htmlEtq = etqs.join('') === '' ? '' : etqs.map(function (n) {
      return '<span class="slot-etq">' + n + '</span>';
    }).join('');

    return '<div class="slot" style="' + esc(estilo) + '" title="' + esc(titulo) + '">'
      + htmlEtq + '</div>';
  }

  /* ================================================================ */
  /* Modal                                                             */
  /* ================================================================ */

  function actividadSel() {
    if (!borrador) return null;
    for (var i = 0; i < borrador.actividades.length; i++) {
      if (borrador.actividades[i].id === seleccion) return borrador.actividades[i];
    }
    return null;
  }

  function abrirModal() {
    borrador = clonar(datos);
    if (!actividadSel()) {
      seleccion = borrador.actividades.length ? borrador.actividades[0].id : null;
    }
    renderModal();
    $('modal').classList.add('abierto');
  }

  function cerrarModal() {
    $('modal').classList.remove('abierto');
    borrador = null;
  }

  function renderModal() {
    renderLista();
    renderForm();
    actualizarPie();
  }

  function renderLista() {
    $('lista-actividades').innerHTML = borrador.actividades.map(function (a, i) {
      var ultima = i === borrador.actividades.length - 1;
      return '<div class="lista-item' + (a.id === seleccion ? ' sel' : '')
        + (a.activa === false ? ' inactiva' : '') + '" data-sel="' + esc(a.id) + '">'
        + '<span class="lista-swatch" style="background:' + esc(a.color) + '"></span>'
        + '<span class="fila-icono">' + icono(a.icono) + '</span>'
        + '<span class="lista-nombre">' + esc(a.nombre) + '</span>'
        + '<span class="lista-acc">'
        + '<button type="button" class="mini" data-mover="-1" data-id="' + esc(a.id) + '" title="Subir"'
        + (i === 0 ? ' disabled' : '') + '>↑</button>'
        + '<button type="button" class="mini" data-mover="1" data-id="' + esc(a.id) + '" title="Bajar"'
        + (ultima ? ' disabled' : '') + '>↓</button>'
        + '<button type="button" class="mini del" data-borrar="' + esc(a.id) + '" title="Eliminar">✕</button>'
        + '</span>'
        + '</div>';
    }).join('') || '<div class="vacio">Sin actividades.</div>';
  }

  function renderForm() {
    var a = actividadSel();
    var p = $('panel-form');

    if (!a) {
      p.innerHTML = '<div class="vacio">Selecciona una actividad de la lista, o crea una nueva.</div>';
      return;
    }

    var nombresIcono = window.ICONOS_NOMBRE || {};
    var opciones = (window.ICONOS_CATEGORIA || []).map(function (k) {
      return '<option value="' + esc(k) + '"' + (k === a.icono ? ' selected' : '') + '>'
        + esc(nombresIcono[k] || k.replace('cat-', '')) + '</option>';
    }).join('');

    var bloques = (a.bloques || []).map(function (b, i) {
      // Las casillas muestran el dia al que PERTENECE la noche, no el natural.
      var marcados = b.dias.map(function (d) { return aDiaCasilla(d, b.desde); });
      var dias = DIAS_INICIAL.map(function (ini, d) {
        var marcado = marcados.indexOf(d) !== -1 ? ' checked' : '';
        return '<label class="dia-chk"><input type="checkbox" data-dia="' + d + '"' + marcado
          + '><span>' + ini + '</span></label>';
      }).join('');

      return '<div class="bloque" data-bloque="' + i + '">'
        + '<div class="bloque-cab">'
        + '<span>Bloque ' + (i + 1) + '</span>'
        + '<button type="button" class="mini del" data-quitar-bloque="' + i + '" title="Quitar bloque">✕</button>'
        + '</div>'
        + '<div class="dias">' + dias + '</div>'
        + '<div class="rango">'
        + '<input type="time" step="1800" class="form-control" data-campo="desde" value="' + esc(b.desde) + '">'
        + '<span class="sep">→</span>'
        + '<input type="time" step="1800" class="form-control" data-campo="hasta" value="' + esc(b.hasta) + '">'
        + '<span class="rango-horas">' + Modelo.formatHoras(Modelo.horasBloque(b)) + '</span>'
        + '</div>'
        + '<div class="bloque-resumen">' + esc(resumenBloque(b)) + '</div>'
        + '</div>';
    }).join('');

    p.innerHTML =
      '<div class="error" id="form-error" hidden></div>'

      + '<div class="fila-campos">'
      + '<div class="campo"><label>Nombre</label>'
      + '<input type="text" class="form-control" data-campo="nombre" value="' + esc(a.nombre) + '"></div>'
      + '<div class="campo"><label>Color</label>'
      + '<input type="color" class="form-control" data-campo="color" value="' + esc(a.color) + '"></div>'
      + '<div class="campo"><label>Icono</label>'
      + '<select class="form-control" data-campo="icono">' + opciones + '</select></div>'
      + '</div>'

      + '<div class="campo">'
      + '<label><input type="checkbox" data-campo="activa"' + (a.activa === false ? '' : ' checked')
      + '> Actividad activa</label>'
      + '<div class="pista">Al desactivarla deja de pintar y de contar horas, pero conserva su configuración.</div>'
      + '</div>'

      + '<div class="campo">'
      + '<label>Bloques de horario fijo</label>'
      + bloques
      + '<button type="button" class="btn btn-bloque" data-anadir-bloque="1">+ Añadir bloque</button>'
      + '<div class="pista">Si la hora final es menor o igual que la inicial, el bloque cruza la medianoche '
      + 'y continúa en el día siguiente (por ejemplo 23:00 → 07:00).</div>'
      + '</div>';
  }

  /* Lee el formulario y lo vuelca sobre la actividad seleccionada del borrador. */
  function recogerForm() {
    var a = actividadSel();
    if (!a) return;
    var p = $('panel-form');
    var inNombre = p.querySelector('[data-campo="nombre"]');
    if (!inNombre) return;

    a.nombre = inNombre.value.trim() || 'Sin nombre';
    a.color = p.querySelector('[data-campo="color"]').value;
    a.icono = p.querySelector('[data-campo="icono"]').value;
    a.activa = p.querySelector('[data-campo="activa"]').checked;

    a.bloques = [].map.call(p.querySelectorAll('[data-bloque]'), function (nodo) {
      var desde = nodo.querySelector('[data-campo="desde"]').value || '00:00';
      return {
        // La casilla dice a que NOCHE pertenece; el modelo guarda dia natural.
        dias: [].map.call(nodo.querySelectorAll('input[data-dia]:checked'), function (c) {
          return aDiaNatural(Number(c.getAttribute('data-dia')), desde);
        }),
        desde: desde,
        hasta: nodo.querySelector('[data-campo="hasta"]').value || '01:00'
      };
    });
  }

  /* Previsualización en vivo del Tiempo Libre mientras se edita. */
  function actualizarPie() {
    if (!borrador) return;
    var calc = Modelo.calcular(borrador.actividades);
    var t = 'Tiempo Libre resultante: ' + Modelo.formatHoras(calc.tiempoLibre);
    if (calc.horasSolapadas > 0) t += '  ·  ' + Modelo.formatHoras(calc.horasSolapadas) + ' solapadas';
    if (calc.conflictos.length) t += '  ·  ⚠ ' + calc.conflictos.length + ' franja(s) con más de 2 actividades';
    $('pie-pista').textContent = t;
  }

  function refrescarHorasBloques() {
    var a = actividadSel();
    if (!a) return;
    var nodos = $('panel-form').querySelectorAll('[data-bloque]');
    [].forEach.call(nodos, function (nodo, i) {
      if (!a.bloques[i]) return;
      var el = nodo.querySelector('.rango-horas');
      if (el) el.textContent = Modelo.formatHoras(Modelo.horasBloque(a.bloques[i]));
      var res = nodo.querySelector('.bloque-resumen');
      if (res) res.textContent = resumenBloque(a.bloques[i]);
    });
  }

  function mostrarError(msg, idCulpable) {
    if (idCulpable && idCulpable !== seleccion) {
      seleccion = idCulpable;
      renderLista();
      renderForm();
    }
    var caja = $('form-error');
    if (!caja) { alert(msg); return; }
    caja.textContent = msg;
    caja.hidden = false;
    caja.scrollIntoView({ block: 'nearest' });
  }

  /* Bloques mal formados. Devuelve {id, msg} para poder saltar al culpable. */
  function validarBorrador() {
    var errs = [];
    borrador.actividades.forEach(function (a) {
      (a.bloques || []).forEach(function (b, i) {
        if (!b.dias.length) {
          errs.push({ id: a.id, msg: '«' + a.nombre + '», bloque ' + (i + 1) + ': no has marcado ningún día.' });
        }
        if (b.desde === b.hasta) {
          errs.push({ id: a.id, msg: '«' + a.nombre + '», bloque ' + (i + 1) + ': la hora de inicio y la de fin son iguales.' });
        }
      });
    });
    return errs;
  }

  function aplicar() {
    recogerForm();

    var errs = validarBorrador();
    if (errs.length) {
      mostrarError(errs.map(function (e) { return '· ' + e.msg; }).join('\n'), errs[0].id);
      return;
    }

    // Se permiten 2 actividades por franja; la tercera se rechaza.
    var calc = Modelo.calcular(borrador.actividades);
    if (calc.conflictos.length) {
      var lista = calc.conflictos.slice(0, 8).map(function (c) {
        return '· ' + DIAS_LARGOS[c.dia] + ' ' + c.desde + ' – ' + c.hasta;
      }).join('\n');
      var mas = calc.conflictos.length > 8 ? '\n… y ' + (calc.conflictos.length - 8) + ' más.' : '';
      mostrarError('Estas franjas tendrían 3 actividades a la vez y solo se permiten 2:\n'
        + lista + mas + '\n\nLibera alguna antes de aplicar.');
      return;
    }

    datos = clonar(borrador);
    Store.guardar(datos);
    render();
    cerrarModal();
  }

  /* ================================================================ */
  /* Acciones de la lista                                              */
  /* ================================================================ */

  function nuevaActividad() {
    recogerForm();
    var a = {
      id: nuevoId(),
      nombre: 'Nueva actividad',
      color: PALETA[borrador.actividades.length % PALETA.length],
      icono: 'cat-free',
      activa: true,
      bloques: [{ dias: [], desde: '09:00', hasta: '10:00' }]
    };
    borrador.actividades.push(a);
    seleccion = a.id;
    renderModal();
  }

  function borrarActividad(id) {
    var a = null, idx = -1;
    borrador.actividades.forEach(function (x, i) { if (x.id === id) { a = x; idx = i; } });
    if (!a) return;
    if (!confirm('¿Eliminar «' + a.nombre + '»?\n\nSus horas volverán al Tiempo Libre.')) return;
    borrador.actividades.splice(idx, 1);
    if (seleccion === id) {
      seleccion = borrador.actividades.length
        ? borrador.actividades[Math.min(idx, borrador.actividades.length - 1)].id
        : null;
    }
    renderModal();
  }

  function moverActividad(id, delta) {
    recogerForm();
    var idx = -1;
    borrador.actividades.forEach(function (x, i) { if (x.id === id) idx = i; });
    var destino = idx + delta;
    if (idx < 0 || destino < 0 || destino >= borrador.actividades.length) return;
    var tmp = borrador.actividades[idx];
    borrador.actividades[idx] = borrador.actividades[destino];
    borrador.actividades[destino] = tmp;
    renderLista();
  }

  /* ================================================================ */
  /* Import / Export                                                   */
  /* ================================================================ */

  function exportar() {
    Store.exportar(datos);
  }

  function importar(file) {
    Store.importar(file).then(function (nuevos) {
      var n = nuevos.actividades.length;
      // Reemplazar es destructivo: se pide confirmación explícita.
      if (!confirm('El archivo contiene ' + n + ' actividad(es).\n\n'
        + 'Esto reemplazará TODOS los datos actuales. ¿Continuar?')) return;
      datos = nuevos;
      Store.guardar(datos);
      render();
    }).catch(function (e) {
      alert('No se ha podido importar:\n\n' + e.message + '\n\nTus datos actuales no se han tocado.');
    });
  }

  /* ================================================================ */
  /* Arranque y eventos                                                */
  /* ================================================================ */

  function init() {
    $('btn-importar').innerHTML = icono('icon-import');
    $('btn-exportar').innerHTML = icono('icon-export');
    $('btn-configurar').innerHTML = icono('icon-settings');

    datos = Store.cargar();
    render();

    if (!Store.disponible()) {
      var av = $('aviso');
      av.textContent = 'Este navegador no permite guardar datos en esta página. '
        + 'Los cambios solo viven en memoria: exporta el JSON antes de cerrar.';
      av.hidden = false;
    }

    $('btn-configurar').addEventListener('click', abrirModal);
    $('btn-exportar').addEventListener('click', exportar);
    $('btn-importar').addEventListener('click', function () { $('file-import').click(); });

    $('file-import').addEventListener('change', function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (f) importar(f);
      ev.target.value = '';   // permite reimportar el mismo archivo
    });

    $('btn-cerrar').addEventListener('click', cerrarModal);
    $('btn-cancelar').addEventListener('click', cerrarModal);
    $('btn-aplicar').addEventListener('click', aplicar);
    $('btn-nueva').addEventListener('click', nuevaActividad);

    $('modal').addEventListener('mousedown', function (ev) {
      if (ev.target === $('modal')) cerrarModal();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && $('modal').classList.contains('abierto')) cerrarModal();
    });

    // Lista: seleccionar, mover, borrar.
    $('lista-actividades').addEventListener('click', function (ev) {
      var btnBorrar = ev.target.closest('[data-borrar]');
      if (btnBorrar) { borrarActividad(btnBorrar.getAttribute('data-borrar')); return; }

      var btnMover = ev.target.closest('[data-mover]');
      if (btnMover) {
        moverActividad(btnMover.getAttribute('data-id'), Number(btnMover.getAttribute('data-mover')));
        return;
      }

      var item = ev.target.closest('[data-sel]');
      if (item) {
        recogerForm();
        seleccion = item.getAttribute('data-sel');
        renderModal();
      }
    });

    // Formulario: añadir/quitar bloques.
    $('panel-form').addEventListener('click', function (ev) {
      var quitar = ev.target.closest('[data-quitar-bloque]');
      if (quitar) {
        recogerForm();
        var a = actividadSel();
        a.bloques.splice(Number(quitar.getAttribute('data-quitar-bloque')), 1);
        renderForm();
        actualizarPie();
        return;
      }
      if (ev.target.closest('[data-anadir-bloque]')) {
        recogerForm();
        actividadSel().bloques.push({ dias: [], desde: '09:00', hasta: '10:00' });
        renderForm();
        actualizarPie();
      }
    });

    // Formulario: cualquier edición recalcula al vuelo.
    $('panel-form').addEventListener('input', function () {
      recogerForm();
      refrescarHorasBloques();
      actualizarPie();
    });
    $('panel-form').addEventListener('change', function (ev) {
      recogerForm();
      refrescarHorasBloques();
      actualizarPie();
      var campo = ev.target.getAttribute && ev.target.getAttribute('data-campo');
      if (campo === 'color' || campo === 'icono' || campo === 'activa') renderLista();
    });
    $('panel-form').addEventListener('keyup', function (ev) {
      if (ev.target.getAttribute && ev.target.getAttribute('data-campo') === 'nombre') renderLista();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
