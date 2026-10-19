// El diálogo «Revisar formato del documento» se llena solo (18-10-2026, formato-militar/v1/modelo.js):
//   · cada renglón del Anexo de Apoyo de Servicio de Combate (los del compilado, como los muestra el
//     diálogo) trae su apartado SUGERIDO del modelo de la Escuela; lo exacto sigue en `destino`;
//   · «Organización de la Tarea» va a su bloque sin numerar antes de SITUACIÓN; lo que no tiene dónde
//     ir se conserva con su título, al final; el título propio del renglón no se pierde;
//   · el anexo se identifica solo: letra y asunto (del título o del cuadro de anexos de la OGO) y el
//     padre (la OGO registrada o el número de la Orden del título); «24» es la OGO No. 24.
const assert = require('node:assert/strict')

;(async () => {
  const m = await import('../formato-militar/v1/modelo.js')
  const it = (ruta, texto, i) => ({ id: String(i), ruta, nodo: { titulo: ruta.split(' / ').at(-1), texto }, destino: null })
  // los renglones del anexo (uDe del compilado), tal como los lista el diálogo con el ejercicio de logística
  const rutas = [
    ['Organización de la Tarea. / Compañía de Sanidad:', 'Puesto de socorro (FICT.)'],
    ['Organización de la Tarea. / Áreas establecidas:', 'ARCE · ASDI'],
    ['SITUACIÓN. / Fuerzas enemigas.', '1.- Terreno. [Obstáculos]'],
    ['SITUACIÓN. / Fuerzas enemigas.', '2.- Condiciones meteorológicas. [Lo que afecte]'],
    ['SITUACIÓN. / Fuerzas enemigas.', '3.- Capacidades logísticas del enemigo. [Compañías]'],
    ['MISIÓN.', 'Los elementos de apoyo… (FICT.)'],
    ['EJECUCIÓN. / Logística. / Fase 1 — OCUPACIÓN (FICT.).', 'El enfoque…'],
    ['EJECUCIÓN. / Logística. / Fase 3.', 'El enfoque…'],
    ['EJECUCIÓN. / Logística. / Funciones Logísticas. / Mantenimiento.', 'no desplegado'],
    ['EJECUCIÓN. / Personal.', 'no desplegado'],
    ['EJECUCIÓN. / Instrucciones de Coordinación. / Eje Principal de Abastecimiento (EPA).', 'EPA: 60 km'],
    ['COMANDO Y COMUNICACIONES. / Comando.', 'PC (FICT.)'],
    ['OTRA COSA DE LA HOJA. / Nota', 'Nunca descartar'],
  ]
  const items = m.sugerencias(rutas.map(([r, t], i) => it(r, t, i)), 'plan-aspc')
  const sug = Object.fromEntries(items.map((x) => [x.ruta + ' · ' + x.nodo.texto.slice(0, 6), x.sugerido]))
  assert.ok(items.every((x) => x.sugerido), 'todos los renglones con apartado: ninguno en «Seleccione apartado»')
  assert.equal(items.find((x) => x.ruta === 'MISIÓN.').destino, 'MISIÓN.', 'lo exacto sigue igual')
  assert.equal(items.filter((x) => x.destino).length, 2, 'sólo MISIÓN y Comando son exactos (la descarga directa no cambia)')
  assert.equal(sug['Organización de la Tarea. / Compañía de Sanidad: · Puesto'], m.DESTINO_ORG)
  assert.equal(sug['Organización de la Tarea. / Áreas establecidas: · ARCE ·'], m.DESTINO_ORG)
  assert.equal(sug['SITUACIÓN. / Fuerzas enemigas. · 1.- Te'], 'SITUACIÓN.', 'sin apartado propio: el de arriba')
  assert.equal(sug['SITUACIÓN. / Fuerzas enemigas. · 2.- Co'], 'SITUACIÓN. / Condiciones Meteorológicas.', 'por cómo empieza el texto')
  assert.equal(sug['SITUACIÓN. / Fuerzas enemigas. · 3.- Ca'], 'SITUACIÓN. / Condiciones Meteorológicas. / Capacidades logísticas del enemigo.')
  assert.equal(sug['EJECUCIÓN. / Logística. / Fase 1 — OCUPACIÓN (FICT.). · El enf'], 'EJECUCIÓN. / Concepto de Apoyo.', 'las fases van al Concepto de Apoyo')
  assert.equal(sug['EJECUCIÓN. / Logística. / Fase 3. · El enf'], 'EJECUCIÓN. / Concepto de Apoyo.')
  assert.equal(sug['EJECUCIÓN. / Logística. / Funciones Logísticas. / Mantenimiento. · no des'], 'EJECUCIÓN. / Concepto de Apoyo. / Funciones Logísticas.', 'el título más hondo que coincide')
  assert.equal(sug['EJECUCIÓN. / Personal. · no des'], 'EJECUCIÓN. / Concepto de Apoyo. / Funciones de Personal.', 'con todas sus palabras')
  assert.equal(sug['EJECUCIÓN. / Instrucciones de Coordinación. / Eje Principal de Abastecimiento (EPA). · EPA: 6'], 'EJECUCIÓN.')
  assert.equal(sug['OTRA COSA DE LA HOJA. / Nota · Nunca '], m.DESTINO_PROPIO, 'lo que no tiene dónde ir se conserva con su título')
  assert.deepEqual(m.DESTINOS_ESPECIALES.map((d) => d[0]), [m.DESTINO_ORG, m.DESTINO_PROPIO])

  // el Word armado con los sugeridos (lo que hace el diálogo al «Descargar DOCX» sin tocar nada)
  const asig = Object.fromEntries(items.map((x) => [x.id, x.destino || x.sugerido]))
  const sec = m.aplicarPlantilla(items, 'plan-aspc', { asignaciones: asig })
  assert.equal(sec[0].titulo, 'ORGANIZACIÓN DE LA TAREA.', 'la Organización de la Tarea primero…')
  assert.equal(sec[0].sinRotulo, true, '…sin numerar')
  assert.deepEqual(sec[0].hijos.map((h) => h.titulo), ['Compañía de Sanidad:', 'Áreas establecidas:'], 'con el título de cada renglón')
  assert.equal(sec[1].titulo, 'SITUACIÓN.')
  const ejec = sec.find((n) => n.titulo === 'EJECUCIÓN.'), fl = JSON.stringify(ejec)
  assert.ok(fl.includes('"titulo":"Mantenimiento."') && fl.includes('no desplegado'), '«Mantenimiento.» no se pierde dentro de Funciones Logísticas')
  assert.equal(sec.find((n) => n.titulo === 'MISIÓN.').hijos[0].titulo, '', 'en un apartado exacto, sin repetir el título')
  const ultimo = sec.at(-1)
  assert.deepEqual([ultimo.titulo, ultimo.sinRotulo, ultimo.hijos[0].titulo, ultimo.hijos[0].texto], ['OTRA COSA DE LA HOJA.', true, 'Nota', 'Nunca descartar'], 'lo propio, al final, con su título')
  assert.throws(() => m.aplicarPlantilla(items, 'plan-aspc', { asignaciones: { ...asig, 12: '' } }), /Asigne el contenido/, 'si el oficial lo deja sin apartado, la Mesa lo dice')

  // el anexo se identifica solo
  const T = 'ANEXO "___" (APOYO DE SERVICIO DE COMBATE)AL PLAN/ORDEN DE OPERACIONES Nº 3'
  const ctx = { ejercicio: 'EJ (FICT.)', unidad: 'DIV.MEC.-1 (FICT.)' }
  let reg = {}, cfg = m.completarSubordinado({ nivel: 'anexo', unidad: ctx.unidad, identificador: '', asunto: '', padre: '' }, { spec: { titulo: T }, ctx, registros: reg, key: 'k' })
  assert.deepEqual([cfg.identificador, cfg.asunto, cfg.padreTitulo], ['F', 'APOYO DE SERVICIO DE COMBATE', 'ORDEN GENERAL DE OPERACIONES No. 3'], 'la letra de la OGO de la Mesa, el asunto y el número de la Orden del título')
  assert.deepEqual(reg[cfg.padre], { ejercicio: ctx.ejercicio, unidad: ctx.unidad, nivel: 'principal', titulo: 'ORDEN GENERAL DE OPERACIONES No. 3', referencia: true }, 'el padre registrado (así baja directo, sin diálogo)')
  assert.ok(m.validarPadre(cfg, ctx, {}, reg))
  // la OGO del G-3 ya registrada en el ejercicio: ése es el padre
  reg = { ogo: { ejercicio: ctx.ejercicio, unidad: ctx.unidad, nivel: 'principal', titulo: 'ORDEN GENERAL DE OPERACIONES', registro: { plantilla: 'orden-operaciones' } } }
  cfg = m.completarSubordinado({ nivel: 'anexo', unidad: ctx.unidad }, { spec: { titulo: T }, ctx, registros: reg, key: 'k' })
  assert.equal(cfg.padre, 'ogo')
  // sin número en el título ni OGO registrada: el padre queda para el diálogo; la letra, del cuadro de anexos de la OGO
  cfg = m.completarSubordinado({ nivel: 'anexo', unidad: ctx.unidad }, { spec: { titulo: 'ANEXO "___" (APOYO DE SERVICIO DE COMBATE) AL PLAN/ORDEN DE OPERACIONES Nº ____' }, ctx: { ...ctx, datosIntegrados: { g3: { opord: { campos: { ANEXOS: '"A" Organización de la Tarea\n"G" Apoyo de Servicio de Combate (G-4)' } } } } }, registros: {}, key: 'k' })
  assert.deepEqual([cfg.identificador, cfg.padre || '', cfg.padreTitulo || ''], ['G', '', ''], 'la letra que puso el G-3 en su OGO')
  // lo que escribió el oficial no se pisa
  cfg = m.completarSubordinado({ nivel: 'anexo', unidad: ctx.unidad, identificador: 'D', asunto: 'LOGÍSTICA', padreTitulo: '24' }, { spec: { titulo: T }, ctx, registros: {}, key: 'k' })
  assert.deepEqual([cfg.identificador, cfg.asunto, cfg.padreTitulo], ['D', 'LOGÍSTICA', 'ORDEN GENERAL DE OPERACIONES No. 24'], '«24» es la OGO No. 24')
  assert.equal(m.tituloPadre('Nº 7'), 'ORDEN GENERAL DE OPERACIONES No. 7')
  assert.equal(m.tituloPadre('PLAN DE OPERACIONES No. 2'), 'PLAN DE OPERACIONES No. 2')
  assert.equal(m.completarSubordinado({ nivel: 'principal' }, { spec: { titulo: T } }).identificador, undefined, 'un documento principal no se toca')

  console.log('formato-militar-destinos.cjs OK — ' + items.length + ' renglones del Anexo de ASC con apartado, Organización de la Tarea sin numerar, lo propio al final, letra/asunto/padre solos')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
