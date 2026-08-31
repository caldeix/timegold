/* TiempoEsOro - Capa de persistencia.
 *
 * UNICA pieza que toca localStorage y archivos. app.js nunca habla con
 * localStorage directamente.
 *
 * Lo que el navegador NO permite desde file:// (seguridad, no carencia del codigo):
 *   - que JS elija por si mismo la ruta de guardado
 *   - que escriba en datos/ sin dialogo
 *   - que lea datos/tiempoesoro-datos.json al arrancar sin seleccion del usuario
 * Por eso exportar pasa por el dialogo de descarga e importar por <input type="file">.
 */
(function (global) {
  'use strict';

  var CLAVE = 'tiempoesoro.v1';
  var VERSION = 1;
  var NOMBRE_ARCHIVO = 'tiempoesoro-datos.json';

  var memoria = null;   // respaldo si localStorage esta bloqueado

  /* Prueba de escritura real. En Safari sobre file:// o en modos restringidos
     localStorage existe pero lanza al escribir. */
  function disponible() {
    try {
      var t = '__te_test__';
      global.localStorage.setItem(t, '1');
      global.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  function estadoVacio() {
    return { version: VERSION, actualizado: null, actividades: [] };
  }

  /* Comprueba la forma. Devuelve {ok:true} o {ok:false, error:"..."}. */
  function validar(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'El archivo no contiene un objeto JSON.' };
    }
    if (typeof obj.version !== 'number') {
      return { ok: false, error: 'Falta el campo "version" o no es un número.' };
    }
    if (!Array.isArray(obj.actividades)) {
      return { ok: false, error: 'Falta el campo "actividades" o no es una lista.' };
    }
    var vistos = {};
    for (var i = 0; i < obj.actividades.length; i++) {
      var a = obj.actividades[i];
      var n = i + 1;
      if (!a || typeof a !== 'object') return { ok: false, error: 'La actividad ' + n + ' no es un objeto.' };
      if (typeof a.id !== 'string' || !a.id) return { ok: false, error: 'La actividad ' + n + ' no tiene "id".' };
      if (typeof a.nombre !== 'string') return { ok: false, error: 'La actividad ' + n + ' no tiene "nombre".' };
      if (vistos[a.id]) return { ok: false, error: 'Hay dos actividades con el mismo id: ' + a.id };
      vistos[a.id] = true;
      if (a.bloques != null && !Array.isArray(a.bloques)) {
        return { ok: false, error: 'Los "bloques" de "' + a.nombre + '" no son una lista.' };
      }
    }
    return { ok: true };
  }

  /* Rellena campos ausentes para que el resto del codigo no tenga que
     comprobar null en cada acceso. Puerta de entrada a futuras migraciones. */
  function migrar(datos) {
    var d = datos || estadoVacio();
    d.version = VERSION;
    d.actividades = (d.actividades || []).map(function (a) {
      return {
        id: a.id,
        nombre: a.nombre || 'Sin nombre',
        color: a.color || '#888888',
        icono: a.icono || 'cat-free',
        activa: a.activa !== false,
        bloques: (a.bloques || []).map(function (b) {
          return {
            dias: (b.dias || []).slice(),
            desde: b.desde || '00:00',
            hasta: b.hasta || '01:00'
          };
        })
      };
    });
    return d;
  }

  /* localStorage -> si vacio o corrupto, estado vacio. No hay datos de ejemplo:
   * la app arranca en blanco y el usuario crea sus propias actividades.
   *
   * En Chrome TODAS las paginas file:// comparten el origen "null" y por tanto el
   * mismo localStorage. Por eso la clave va prefijada y nunca se asume que lo
   * encontrado sea nuestro: si no valida, se descarta y se arranca vacio en lugar
   * de romper.
   */
  function cargar() {
    var crudo = null;
    if (disponible()) {
      try { crudo = global.localStorage.getItem(CLAVE); } catch (e) { crudo = null; }
    } else if (memoria) {
      return migrar(JSON.parse(JSON.stringify(memoria)));
    }

    if (crudo) {
      try {
        var obj = JSON.parse(crudo);
        if (validar(obj).ok) return migrar(obj);
      } catch (e) { /* corrupto: se descarta y se arranca vacio */ }
    }

    return estadoVacio();
  }

  function guardar(datos) {
    datos.actualizado = new Date().toISOString();
    if (!disponible()) {
      memoria = JSON.parse(JSON.stringify(datos));
      return false;
    }
    try {
      global.localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      memoria = JSON.parse(JSON.stringify(datos));
      return false;
    }
  }

  function borrar() {
    memoria = null;
    if (disponible()) {
      try { global.localStorage.removeItem(CLAVE); } catch (e) { /* nada que hacer */ }
    }
  }

  /* Dispara la descarga. Con "Preguntar siempre donde guardar" activo en Chrome
     se abre el dialogo y el usuario elige la carpeta datos/ del proyecto. */
  function exportar(datos) {
    var copia = JSON.parse(JSON.stringify(datos));
    copia.actualizado = new Date().toISOString();
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = NOMBRE_ARCHIVO;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Promise<datos>. Rechaza con un mensaje legible; quien llama decide si
     reemplaza el estado. Ante error, el estado actual no se toca. */
  function importar(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No se ha seleccionado ningún archivo.'));
      var lector = new FileReader();
      lector.onerror = function () { reject(new Error('No se ha podido leer el archivo.')); };
      lector.onload = function () {
        var obj;
        try {
          obj = JSON.parse(lector.result);
        } catch (e) {
          return reject(new Error('El archivo no es JSON válido.'));
        }
        var v = validar(obj);
        if (!v.ok) return reject(new Error(v.error));
        resolve(migrar(obj));
      };
      lector.readAsText(file);
    });
  }

  global.Store = {
    CLAVE: CLAVE,
    NOMBRE_ARCHIVO: NOMBRE_ARCHIVO,
    disponible: disponible,
    cargar: cargar,
    guardar: guardar,
    borrar: borrar,
    validar: validar,
    migrar: migrar,
    exportar: exportar,
    importar: importar
  };
})(window);
