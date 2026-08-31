# TiempoEsOro

Planificador semanal de **time-blocking** sobre el límite absoluto de las **168 horas** que tiene una semana.

Se abre con doble clic en `index.html`. Sin servidor, sin WAMP, sin Node, sin CDN, sin instalar nada.

---

## Uso

1. Doble clic en **`index.html`**.
2. Botón **Configurar** (arriba a la derecha) para crear, editar, reordenar, activar/desactivar o eliminar actividades.
3. Los cambios se guardan solos. No hay botón de guardar.

### Ajuste necesario en Chrome (una sola vez)

Para que **Exportar** te deje elegir la carpeta en lugar de descargar en silencio:

`Chrome → Configuración → Descargas → «Preguntar siempre dónde guardar los archivos»`

Sin ese interruptor Chrome descarga directo a *Descargas* y además no sobrescribe: te iría dejando `tiempoesoro-datos (1).json`, `(2)`, etc.

---

## Cómo se tratan los datos

**El navegador es la libreta donde escribes a diario; el JSON es la fotocopia que sacas cuando te interesa.**

| | Qué hace |
|---|---|
| **Día a día** | Todo vive en `localStorage`. Cada cambio se guarda al instante y sigue ahí al cerrar y reabrir. |
| **Exportar** | Se abre el diálogo de guardado → eliges `datos/` → sobrescribes `tiempoesoro-datos.json`. |
| **Importar** | Selector de archivo (se abre en la última carpeta usada). Valida el JSON antes de reemplazar nada. |
| **Primera vez** | Arranca **en blanco**. No hay datos de ejemplo: pulsa Configurar y crea tus actividades, o importa un JSON. |

### Límites que conviene conocer

- El `.json` **no se actualiza solo**. Es respaldo e intercambio, no el almacén vivo.
- Borrar los datos de navegación o usar modo incógnito **borra los registros**. Exporta de vez en cuando.
- Los datos son por navegador y por máquina: no se sincronizan entre equipos.
- Límite práctico de `localStorage`: unos 5 MB (miles de actividades; no lo vas a rozar).

### Por qué no escribe en `datos/` por su cuenta

No es una carencia del código: desde `file://` el navegador **prohíbe** que JavaScript elija una ruta de guardado, escriba en una carpeta sin diálogo o lea un archivo que el usuario no haya seleccionado. Tampoco vale `fetch()` para leer el JSON al arrancar: con origen `null` está bloqueado por CORS. Por eso exportar pasa por el diálogo de descarga e importar por un `<input type="file">`.

La API que sí permitiría autoguardado directo (File System Access) exige `localhost` o `https://`, es decir, un servidor. Queda descartada por diseño.

---

## Las reglas del cálculo

**Tiempo Libre = 168 h − horas ocupadas.** Nunca se introduce a mano; siempre se calcula.

Todo se apoya en una rejilla de **7 días × 48 medias horas = 336 franjas**.

- **Solape:** dos actividades pueden compartir franja. La media hora se parte **mitad y mitad con separación vertical**: el bloque más largo a la izquierda y el corto que lo interrumpe a la derecha. Una tercera se rechaza indicando día y hora.
- **El tiempo es el del reloj.** Una franja ocupada cuenta **una vez**, la solapen una o dos actividades. Si trabajas de 08:00 a 16:00 y sacas al perro de 10:00 a 10:30, el reloj solo avanza 8 h: escaparte media hora dentro de un tiempo ya comprometido no cuesta media hora más. Por eso las 168 h cuadran siempre.
- **Medianoche:** si la hora final es menor o igual que la inicial, el bloque continúa en el día siguiente. *Sueño 23:00 → 07:00* son 8 h, no 16.
- **La matriz arranca a las 06:00** y las horas previas se van al final: `06:00 … 23:00, 00:00 … 05:00`. Una línea turquesa marca dónde da la vuelta. Para cambiarlo, la constante `HORA_INICIO` al principio de `app.js`.

### El día va de las 06:00 a las 05:30, no de 00:00 a 23:59

Las filas del final llevan la marca **`+1`**: son la **madrugada del día natural siguiente**. La columna del viernes cubre desde las 06:00 del viernes hasta las 05:30 del sábado.

Consecuencia práctica: **si te acuestas el sábado a las 00:30, eso es la noche del viernes y se pinta en la columna del viernes.** Es la lectura natural — cuando dices "el viernes me acosté tarde" no te refieres a las 00:30 del viernes.

**Las casillas del modal usan esa misma definición de día.** Marcas `Viernes` con horario `00:30 → 09:00` y significa *la noche del viernes*; la app se encarga sola de guardarlo como sábado 00:30. Nunca hay que hacer la conversión mental.

Para que no quede ninguna duda, cada bloque muestra debajo, en vivo, lo que hace en cristiano:

```
Noche del lunes → Lun 23:30 → Mar 07:30  (8 h)   ×6 días
Noche del viernes → Sáb 00:30 → Sáb 09:00  (8,5 h)
```

Por dentro el modelo sigue guardando **días naturales**; la traducción vive solo en la capa de interfaz (`aDiaNatural` / `aDiaCasilla` en `app.js`) y es una biyección exacta, así que el JSON exportado no cambia de formato.

Una noche completa aparece partida entre dos columnas, y es correcto: te acuestas el lunes a las 23:30 (abajo en la columna del lunes, incluida la madrugada `+1`) y la cola posterior a las 06:00 sale arriba en la columna del martes.
- **Desactivar** una actividad la saca de la matriz y devuelve sus horas al Tiempo Libre, conservando su configuración.
- **Time-blocking estricto:** si no está en la matriz, no existe. Toda hora que se resta de las 168 tiene un sitio concreto en el calendario.

### Al pasar el ratón

El tooltip muestra el **tramo contiguo completo**, no la media hora concreta bajo el cursor. Si estudias de 19:00 a 21:30, en cualquiera de esas cinco medias horas leerás `Universidad · Lunes 19:00 – 21:30`.

Los tramos se calculan recorriendo la semana como una secuencia circular de 336 medias horas, así que un bloque que cruza la medianoche sale como **uno solo**: `Sueño · Lunes 23:00 – Martes 07:00`, y no partido en dos.

Con dos actividades solapadas, cada una muestra su propio rango en una línea:

```
Trabajo · Lunes 09:00 – 14:00
Pasear perro · Lunes 10:00 – 10:30
```

---

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura: resumen (25 %), matriz (75 %), modal |
| `styles.css` | Dark mode, layout, rejilla de medias horas, diagonales del solape |
| `modelo.js` | Rejilla, solapes y cómputo de las 168 h. **Sin DOM** |
| `store.js` | Único punto que toca `localStorage` y archivos |
| `app.js` | Render, modal y eventos. Nunca toca `localStorage` |
| `iconos.js` | Registro inline de los SVG |
| `img/` | Los mismos 10 iconos como archivos sueltos |
| `datos/` | Carpeta destino de export/import |

`modelo.js` va separado a propósito: el cálculo de las 168 h con solapes es la parte con riesgo real de error, y aislada se puede verificar sola desde la consola sin tocar la interfaz.

```js
// En la consola del navegador (F12):
var c = Modelo.calcular(Store.cargar().actividades);
console.log(c.horasReloj + c.tiempoLibre);   // debe dar 168 exacto, siempre
```

### Iconos

19 categorías disponibles en el desplegable del modal: Sueño, Trabajo, Estudios, Comida, Deporte, Inversión, Tiempo libre, Mascota, Familia, Social, Desplazamiento, Compras, Casa, Lectura, Música, Ocio / juegos, Salud, Meditación y Proyectos.

Para añadir uno nuevo: crea `img/cat-loquesea.svg` y regístralo en `iconos.js` con la misma clave (y su etiqueta en `ICONOS_NOMBRE`). Aparece solo en el desplegable.

### Los iconos están dos veces, y es a propósito

Un SVG cargado con `<img src="img/cat-sleep.svg">` se renderiza aislado: el CSS de la página no cascadea dentro, así que `currentColor` resolvería a negro y el icono nunca tomaría el color de su actividad. Y `fetch()` para inyectarlo está bloqueado en `file://`.

Solución: los archivos viven en `img/` como fuente reutilizable, y el mismo marcado está registrado inline en `iconos.js`, que es de donde pinta la app.
