// Reemplazos del 2026-10-23 sobre calcos/assets/index-tareas-chicas-20261023.js → index-puntos-chicos-20261023.js.
// Lo pidió Sergio mirando el plan de barreras en el 🏙️ Google 3D: «reduce de tamaño los puntos de control un 60 % y
// los aines (AIN) un 50 %».
//   · el punto de coordinación y control (⊗, `bY`, 44 px) se dibuja al 40 %: el mismo dibujo (viewBox) en un SVG más
//     chico, con el trazo un poco más grueso en el viewBox para que a ese tamaño no se pierda;
//   · el rótulo «AIN n» (`_Y`, ya al 60 % desde el 21-10-2026) pasa a la mitad: 30 % del original. Con la letra de
//     antes quedaría de 4,5 px: en el viewBox la letra crece (20 en vez de 15; la fecha de abajo, 17 en vez de 11,5) y,
//     si el nombre es largo, se ajusta al ancho del recuadro.
// Los dos se usan en la carta 2D (`Sve`, `Cve`) y en el ⛰️ 3D (`On(bY())`, `_Y(…).html`); el 🏙️ Google 3D toma el
// tamaño del dibujo de la carta 2D. Lo ya puesto cambia solo: se guarda el lugar, no el dibujo.
//
// SHA-256 de index-tareas-chicas-20261023.js (antes de estos reemplazos): 6a2bd6f9a82286e0138ce7738f4154ab8cb263f8e48dbf3db318e4090c3622af
module.exports = [
  {
    nombre: 'Punto de coordinación (bY): SVG al 40 % y trazo más grueso',
    viejo:
      'e=`<svg width="44" height="44" viewBox="0 0 44 44" style="overflow:visible">\n' +
      '    <defs><clipPath id="${t}"><circle cx="22" cy="22" r="17"/></clipPath></defs>\n' +
      '    <circle cx="22" cy="22" r="17" fill="none" stroke="${cE}" stroke-width="5"/>\n' +
      '    <g clip-path="url(#${t})" stroke="${cE}" stroke-width="5.5" stroke-linecap="round">',
    nuevo:
      'e=`<svg width="${44*.4}" height="${44*.4}" viewBox="0 0 44 44" style="overflow:visible">\n' +
      '    <defs><clipPath id="${t}"><circle cx="22" cy="22" r="17"/></clipPath></defs>\n' +
      '    <circle cx="22" cy="22" r="17" fill="none" stroke="${cE}" stroke-width="7"/>\n' +
      '    <g clip-path="url(#${t})" stroke="${cE}" stroke-width="7" stroke-linecap="round">',
    veces: 1,
  },
  {
    nombre: 'Punto de coordinación (bY): el divIcon con el tamaño nuevo',
    viejo: 'return{svg:e,html:`<div style="${yY}">${e}</div>`,w:44,h:44}}',
    nuevo: 'return{svg:e,html:`<div style="${yY}">${e}</div>`,w:44*.4,h:44*.4}}',
    veces: 1,
  },
  {
    nombre: 'Rótulo AIN (_Y): SVG al 30 % (la mitad de antes)',
    viejo: 'i=34+(a?14:0),o=`<svg width="${62*.6}" height="${i*.6}" viewBox="0 0 62 ${i}" style="overflow:visible">',
    nuevo: 'i=34+(a?20:0),o=`<svg width="${62*.3}" height="${i*.3}" viewBox="0 0 62 ${i}" style="overflow:visible">',
    veces: 1,
  },
  {
    nombre: 'Rótulo AIN (_Y): la letra más grande en el viewBox para que se siga leyendo',
    viejo:
      'font-family="Arial" font-size="15" font-weight="bold" fill="#7a3d00"\n' +
      '      letter-spacing="0.4">${n}</text>\n' +
      '    ${a?`<text x="${62/2}" y="40" text-anchor="middle" font-family="Arial" font-size="11.5"\n' +
      '      font-weight="bold" fill="#5a2d00" stroke="#fff" stroke-width="3.2"',
    nuevo:
      'font-family="Arial" font-size="20" font-weight="bold" fill="#7a3d00"\n' +
      '      ${n.length>5?\'textLength="54" lengthAdjust="spacingAndGlyphs"\':""}>${n}</text>\n' +
      '    ${a?`<text x="${62/2}" y="48" text-anchor="middle" font-family="Arial" font-size="17"\n' +
      '      font-weight="bold" fill="#5a2d00" stroke="#fff" stroke-width="4"',
    veces: 1,
  },
  {
    nombre: 'Rótulo AIN (_Y): el divIcon con el tamaño nuevo',
    viejo: '</svg>`;return{svg:o,html:o,w:62*.6,h:34*.6}}var _u=',
    nuevo: '</svg>`;return{svg:o,html:o,w:62*.3,h:34*.3}}var _u=',
    veces: 1,
  },
]
