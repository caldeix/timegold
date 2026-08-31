/* TiempoEsOro - Registro de iconos SVG.
 *
 * Los mismos SVG existen como archivos en img/, pero la app pinta desde AQUI.
 * Motivo: un <img src="img/x.svg"> se renderiza aislado y el CSS de la pagina no
 * cascadea dentro, asi que currentColor resolveria a negro y el icono nunca
 * tomaria el color de su actividad. Y fetch() esta bloqueado en file://.
 * Inyectados inline con innerHTML, currentColor funciona.
 *
 * Para anadir uno nuevo: crear img/cat-loquesea.svg y registrarlo aqui con la
 * misma clave; aparece solo en el desplegable del modal.
 */
window.ICONOS = {
  'icon-import': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/></svg>',
  'icon-export': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/></svg>',
  'icon-settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2.2"/><circle cx="15" cy="12" r="2.2"/><circle cx="7" cy="18" r="2.2"/></svg>',
  'cat-sleep': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  'cat-work': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="19" height="13.5" rx="2"/><path d="M8.5 7V5.2A2.2 2.2 0 0 1 10.7 3h2.6a2.2 2.2 0 0 1 2.2 2.2V7"/><path d="M2.5 12.5h19"/></svg>',
  'cat-university': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.5 8.6 12 13.2l9.5-4.6L12 4z"/><path d="M6.5 10.8v4.9c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-4.9"/><path d="M21.5 8.6v5.2"/></svg>',
  'cat-nutrition': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v6a2.2 2.2 0 0 0 4.4 0V3"/><path d="M9.2 11.2V21"/><path d="M16.8 3c1.6 1.2 2.2 2.9 2.2 5.2 0 1.9-.7 3.2-2.2 3.8V21"/></svg>',
  'cat-training': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M17.5 6.5v11"/><path d="M3.2 9.2v5.6M20.8 9.2v5.6"/><path d="M6.5 12h11"/></svg>',
  'cat-crypto': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.8"/><path d="m7.8 14.4 2.6-2.6 2.1 2.1 3.7-3.7"/><path d="M16.2 13.1v-2.9h-2.9"/></svg>',
  'cat-free': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.2v2.4M12 19.4v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.2 12h2.4M19.4 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></svg>',
  'cat-dog': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.8" cy="8.6" r="2"/><circle cx="12" cy="6.7" r="2.1"/><circle cx="17.2" cy="8.6" r="2"/><path d="M12 11.4c-3 0-5.4 2.2-5.4 4.9 0 1.9 1.5 3.2 3.3 3.2.8 0 1.4-.3 2.1-.3s1.3.3 2.1.3c1.8 0 3.3-1.3 3.3-3.2 0-2.7-2.4-4.9-5.4-4.9z"/></svg>',
  'cat-family': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6.8" r="2.7"/><circle cx="16.6" cy="8" r="2.2"/><path d="M2.8 20v-1.6A4.6 4.6 0 0 1 7.4 13.8h1.2a4.6 4.6 0 0 1 4.6 4.6V20"/><path d="M15.2 20v-1.3a3.7 3.7 0 0 1 3.7-3.7h.2a3.7 3.7 0 0 1 3.1 3.7V20"/></svg>',
  'cat-social': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7.8" r="3.1"/><path d="M2.6 20v-1.7a4.5 4.5 0 0 1 4.5-4.5h3.8a4.5 4.5 0 0 1 4.5 4.5V20"/><path d="M17.2 4.4a3.1 3.1 0 0 1 0 6"/><path d="M19 13.9a4.5 4.5 0 0 1 2.4 4v2.1"/></svg>',
  'cat-commute': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.4 13.2 2.2-4.8a2 2 0 0 1 1.8-1.2h9.2a2 2 0 0 1 1.8 1.2l2.2 4.8"/><rect x="2.9" y="13.2" width="18.2" height="4.8" rx="1.5"/><path d="M6.6 18v1.5M17.4 18v1.5"/><path d="M6.9 15.6h.01M17.1 15.6h.01"/></svg>',
  'cat-shopping': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 4h2.4l2.5 10.6a1.7 1.7 0 0 0 1.7 1.3h7.9a1.7 1.7 0 0 0 1.7-1.3L20.4 7.6H6.1"/><circle cx="9.6" cy="19.2" r="1.4"/><circle cx="17.2" cy="19.2" r="1.4"/></svg>',
  'cat-home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 10.6 12 3.4l8.8 7.2"/><path d="M5.4 9v10.6h13.2V9"/><path d="M9.7 19.6v-6.2h4.6v6.2"/></svg>',
  'cat-reading': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.9S10.1 5 6.7 5H3.3v12.6h3.4C10.1 17.6 12 19.4 12 19.4"/><path d="M12 6.9S13.9 5 17.3 5h3.4v12.6h-3.4c-3.4 0-5.3 1.8-5.3 1.8"/><path d="M12 6.9v12.5"/></svg>',
  'cat-music': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 17.8V6.1l10.2-2v11.4"/><circle cx="6.6" cy="17.8" r="2.6"/><circle cx="16.8" cy="15.5" r="2.6"/></svg>',
  'cat-gaming': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.4" y="7.4" width="19.2" height="9.6" rx="4.3"/><path d="M7 10.4v3.6M5.2 12.2h3.6"/><path d="M15.9 11.4h.01M18.1 13.4h.01"/></svg>',
  'cat-health': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.4S4.1 15.6 4.1 10.2A4.7 4.7 0 0 1 12 6.9a4.7 4.7 0 0 1 7.9 3.3c0 5.4-7.9 10.2-7.9 10.2z"/><path d="M6.4 11.6h2.9l1.5-2.5 2.1 4.6 1.4-2.1h3.3"/></svg>',
  'cat-meditation': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5.9" r="2.5"/><path d="M12 9.6v3.6"/><path d="M4.6 19.4c0-2.7 3.3-4.8 7.4-4.8s7.4 2.1 7.4 4.8z"/><path d="M12 13.2 7.4 15.5M12 13.2l4.6 2.3"/></svg>',
  'cat-creative': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 18.2h5.8"/><path d="M10 21h4"/><path d="M12 3a6.2 6.2 0 0 0-3.6 11.2c.6.5.9 1.2.9 2v.1h5.4v-.1c0-.8.3-1.5.9-2A6.2 6.2 0 0 0 12 3z"/></svg>',
};

/* Etiquetas legibles para el desplegable del modal. */
window.ICONOS_NOMBRE = {
  'cat-sleep':      'Sueño',
  'cat-work':       'Trabajo',
  'cat-university': 'Estudios',
  'cat-nutrition':  'Comida',
  'cat-training':   'Deporte',
  'cat-crypto':     'Inversión',
  'cat-free':       'Tiempo libre',
  'cat-dog':        'Mascota',
  'cat-family':     'Familia',
  'cat-social':     'Social',
  'cat-commute':    'Desplazamiento',
  'cat-shopping':   'Compras',
  'cat-home':       'Casa',
  'cat-reading':    'Lectura',
  'cat-music':      'Música',
  'cat-gaming':     'Ocio / juegos',
  'cat-health':     'Salud',
  'cat-meditation': 'Meditación',
  'cat-creative':   'Proyectos'
};

/* Claves ofrecidas en el desplegable del modal. */
window.ICONOS_CATEGORIA = Object.keys(window.ICONOS).filter(function (k) {
  return k.indexOf('cat-') === 0;
});
