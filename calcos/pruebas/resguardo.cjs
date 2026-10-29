// 🛟 RESGUARDO (calcos/guardado/v1/resguardo.js), lo que se prueba en Node:
//   · la sesión como la lee index.html (profesor / cursante, vencida, sin fecha);
//   · cuándo cambió el ejercicio (la hora de la foto no cuenta) y su huella;
//   · las copias de esta computadora: sin repetir, las 8 más nuevas; la «más nueva que la nube»;
//   · los nombres de los archivos (tu carpeta, respaldos por día, la bajada) y que el JSON que se
//     guarda lo abre «📂 Abrir archivo JSON» como el ejercicio entero, con su nombre;
//   · el index carga el resguardo ANTES del compilado y sin defer.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const RAIZ = path.resolve(__dirname, '..')
const R = require('../guardado/v1/resguardo.js')
const { ejercicioLogistica } = require('./logistica-ejemplo.js')

;(async () => {
  new vm.Script(fs.readFileSync(path.join(RAIZ, 'guardado/v1/resguardo.js'), 'utf8'))
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')
  const tag = html.match(/<script src="\.\/guardado\/v1\/resguardo\.js[^"]*"( defer)?><\/script>/)
  assert.ok(tag, 'el index carga resguardo.js')
  assert.equal(tag[1], undefined, 'sin defer: mira las respuestas de SIDECEME desde el primer pedido')
  assert.ok(html.indexOf('resguardo.js') > html.indexOf('window.SIDECEME_CALCOS = {'), 'después de leer la sesión')
  assert.ok(html.indexOf('resguardo.js') < html.search(/assets\/index-[\w-]+\.js/), 'antes del compilado')
  assert.match(html, /guardado\/v1\/resguardo\.css/)

  // ─── la sesión ───
  const ahora = Date.parse('2026-10-18T10:00:00Z')
  const st = (o) => (k) => (k in o ? o[k] : null)
  let s = R.leerSesion(st({ sideceme_token_p: 'P', sideceme_token_expira_p: '2026-10-18T12:00:00Z' }), ahora)
  assert.deepEqual([s.token, s.vencida, s.profesor, s.expira], ['P', false, true, Date.parse('2026-10-18T12:00:00Z')])
  s = R.leerSesion(st({ sideceme_token_p: 'P', sideceme_token_expira_p: '2026-10-16T23:03:27Z' }), ahora)
  assert.deepEqual([s.token, s.vencida, s.profesor], [null, true, false], 'la del 16-10 a las 19:03 ya venció')
  s = R.leerSesion(st({ sideceme_token: 'C', sideceme_token_expira: '2026-10-19T00:00:00Z' }), ahora)
  assert.deepEqual([s.token, s.profesor], ['C', false], 'un cursante')
  s = R.leerSesion(st({ sideceme_token: 'C', sideceme_token_expira: '2026-10-19T00:00:00Z', sideceme_token_expira_p: '2026-10-16T00:00:00Z' }), ahora)
  assert.deepEqual([s.token, s.vencida, s.profesor], ['C', false, false], 'una fecha vieja del profesor no vence la sesión del alumno')
  s = R.leerSesion(st({ sideceme_token_p: 'P' }), ahora)
  assert.deepEqual([s.token, s.vencida, s.expira], ['P', false, null], 'sin fecha de vencimiento: vale')
  assert.equal(R.leerSesion(st({}), ahora).token, null)

  // ─── cuándo cambió ───
  const ej = ejercicioLogistica({ conPropuestas: true })
  const a = R.texto({ ...ej, guardadoEn: '2026-10-18T10:00:00Z' }), b = R.texto({ ...ej, guardadoEn: '2026-10-18T10:05:00Z' })
  assert.equal(a, b, 'la hora de la foto no cuenta')
  assert.equal(R.huella(a), R.huella(b))
  const c = R.texto({ ...ej, mision: ej.mision + ' (cambio)' })
  assert.notEqual(R.huella(a), R.huella(c), 'otro contenido, otra huella')
  assert.equal(R.vacio(ej), false)
  assert.equal(R.vacio({ version: 1, nombre: 'x', ops: {}, unidades: [] }), true, 'una pantalla en blanco no se resguarda')
  for (const datos of [{ hojasG: { g1: { tareas: ['trabajo'] } } }, { hojasG: { cmte: { guia: 'orientación' } } }, { g3: { coa: 'curso propio' } }, { fasesCOA: { propio: [{ nombre: 'Fase 1' }] } }, { ops: { obstaculos: [{ id: 'obstáculo' }] } }]) {
    assert.equal(R.vacio({ nombre: 'Sólo documentos', ...datos }), false, 'se protege el trabajo aunque todavía no tenga terreno')
  }

  // ─── las copias ───
  const copia = (h, min) => ({ clave: 'X|' + h, nombre: 'X', h, t: new Date(ahora + min * 60000).toISOString(), bytes: 10 })
  const l = [copia('a', 1), copia('b', 2), copia('c', 3), copia('d', 4), copia('e', 5), copia('f', 6), copia('g', 7), copia('h', 8), copia('i', 9), copia('j', 10)]
  const p = R.podar(l, R.MAX_COPIAS)
  assert.equal(R.MAX_COPIAS, 8)
  assert.deepEqual(p.quedan.map((x) => x.h), ['j', 'i', 'h', 'g', 'f', 'e', 'd', 'c'], 'las 8 más nuevas')
  assert.deepEqual(p.sobran.map((x) => x.h).sort(), ['a', 'b'])
  assert.deepEqual(R.podar([copia('a', 1), { ...copia('a', 5) }], 8).quedan.length, 1, 'sin repetir')
  // al abrir la versión vieja de la nube, la copia más nueva de esta computadora es la de antes
  const nube = ahora + 2 * 60000
  assert.equal(R.masNueva(l, 'j', nube).h, 'i', 'la más nueva que no es la de pantalla')
  assert.equal(R.masNueva([copia('a', 1), copia('b', 2.5)], 'z', nube), null, 'si no es más nueva que la nube (con 1 min de margen), no hay aviso')

  // ─── los archivos ───
  const t = Date.parse('2026-10-18T14:42:00')
  assert.equal(R.archivoDe('CE-VI.1'), 'CE-VI.1.json')
  assert.equal(R.archivoDe('A/B: c?'), 'A-B- c-.json', 'sin los caracteres que no van en un nombre de archivo')
  assert.equal(R.respaldoDe('CE-VI.1', t), 'CE-VI.1 2026-10-18.json')
  assert.equal(R.bajadaDe('CE-VI.1', t), 'EJERCICIO_CE-VI.1_2026-10-18_1442.json')
  const txt = R.contenido(a, t)
  const j = JSON.parse(txt)
  assert.equal(j.guardadoEn, new Date(t).toISOString(), 'con la hora de la copia')
  assert.equal(j.nombre, ej.nombre)
  const A = await import(path.join(RAIZ, 'areas-operaciones/abrir-archivo.mjs'))
  const ab = A.ejercicioDeArchivo(j, { archivo: R.bajadaDe(ej.nombre, t) })
  assert.equal(ab.ok, true)
  assert.equal(ab.tipo, 'ejercicio', '«📂 Abrir archivo JSON» lo abre como el ejercicio entero')
  assert.equal(ab.nombre, ej.nombre)
  assert.equal(A.nombreDeArchivo(R.bajadaDe('CE-VI.1', t)), 'CE-VI.1', 'el nombre de la bajada vuelve a ser el del ejercicio')
  assert.equal(A.nombreDeArchivo(R.archivoDe('CE-VI.1')), 'CE-VI.1')
  assert.deepEqual(Object.keys(ab.datos.ops.zonasLog[0]), Object.keys(ej.ops.zonasLog[0]), 'todo el ejercicio adentro')

  console.log('resguardo.cjs OK — sesión (profesor, cursante, vencida), huella sin la hora, 8 copias sin repetir, la más nueva que la nube, archivos y «📂 Abrir archivo JSON»')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
