// 📕 La carpeta del profesor (calcos/modalidad/carpeta.js): con la respuesta REAL que Sergio pegó
// el 10-10-2026 para el paso 4 (CMOC, pruebas/respuesta-cmoc-profesor.md):
//   · separa la sección «PARA EL PROFESOR» del documento (y no corta una oración que empieza así);
//   · reconoce si es solución del profesor (por la línea «DESTINO:», por el texto o por el paso);
//   · guarda una respuesta por paso, la reemplaza, la saca, cambia el destino;
//   · suma lo «PARA EL PROFESOR» de todos los pasos, en orden;
//   · arma el bloque para los pedidos (sin el paso que se pide, repartiendo el espacio);
//   · el .md: legible, en tres partes, y se vuelve a cargar igual (ida y vuelta) aunque el texto
//     traiga «-->»; un .md cualquiera no se carga.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const C = require('../modalidad/carpeta.js')
const CAT = require('../modalidad/catalogo.js')

const RESP = fs.readFileSync(path.join(__dirname, 'respuesta-cmoc-profesor.md'), 'utf8')
const paso = (n) => CAT.PROFESOR.find((p) => p.n === n)

// separar
const s = C.separar(RESP)
assert.match(s.producto, /^# CALCO MODIFICADO DE OBSTÁCULOS COMBINADOS \(CMOC\)/)
assert.match(s.producto, /Minas antitanque históricas reportadas en los flancos de Tambo Quemado y Pisiga\.$/, 'sin la raya «---» del final')
assert.doesNotMatch(s.producto, /PARA EL PROFESOR|Punto crítico/)
assert.match(s.profesor, /^\* \*\*Destino de este documento:\*\*/)
assert.match(s.profesor, /Punto crítico a evaluar:\* Verifique si los alumnos identifican que la AA Sur/)
assert.equal(C.separar('Hola\nPara el profesor es importante que esto quede.\nFin').profesor, '', 'una oración no es el título')
assert.deepEqual(C.separar('A\n**PARA EL PROFESOR:** mirá esto\n- uno\n## Otra\nB'), { producto: 'A\n## Otra\nB', profesor: 'mirá esto\n- uno' })
assert.deepEqual(C.separar('# Doc\n## PARA EL PROFESOR\nnota\n### sub\nmás\n## Anexo\nX'), { producto: '# Doc\n## Anexo\nX', profesor: 'nota\n### sub\nmás' }, 'hasta el próximo título del mismo nivel')
assert.equal(C.separar('Doc\n\nPara el profesor:\n- a\n- b').profesor, '- a\n- b')

// destino
assert.equal(C.destinoDe(paso(4), RESP), 'solucion', 'la respuesta dice SOLUCIÓN DEL PROFESOR')
assert.equal(C.destinoDe(paso(4), 'DESTINO: VA A LOS ALUMNOS\n# CMOC\n… y la solución del profesor queda aparte'), 'alumnos', 'manda la línea DESTINO')
assert.equal(C.destinoDe(paso(4), '**DESTINO:** SOLUCIÓN DEL PROFESOR (no va a los alumnos)\n# CMOC'), 'solucion')
assert.equal(C.destinoDe(paso(4), '# CMOC\nAvenidas…'), 'alumnos')
assert.equal(C.destinoDe(paso(7), '# CAE'), 'solucion', 'los CAE son siempre solución')
assert.equal(C.destinoDe(paso(5), RESP), 'alumnos', 'la OGO va siempre a los alumnos')

// poner, reemplazar, quitar, cambiar el destino
let c = C.vacia('EJERCICIO X')
c = C.poner(c, paso(4), RESP, { ahora: '2026-10-10T21:40:00.000Z' })
assert.equal(C.cuantos(c), 1)
assert.equal(c.pasos[4].destino, 'solucion'); assert.equal(c.pasos[4].tit, 'CMOC: avenidas de aproximación y terreno clave'); assert.equal(c.pasos[4].texto, RESP.trim())
c = C.poner(c, paso(7), 'DESTINO: SOLUCIÓN DEL PROFESOR\n# CAE MÁS PROBABLE\nAtaque por la AA-E 2.\n\n## PARA EL PROFESOR\nQue el G-2 vea la reserva en Pisiga.', { ahora: '2026-10-10T22:00:00.000Z' })
c = C.poner(c, paso(5), '# OGO N° 1\nTexto.', { ahora: '2026-10-10T22:10:00.000Z' })
assert.deepEqual(C.lista(c).map((p) => p.n), [4, 5, 7], 'en orden de paso')
const otro = C.poner(c, paso(5), '# OGO N° 2', { ahora: '2026-10-10T23:00:00.000Z' })
assert.equal(otro.pasos[5].texto, '# OGO N° 2', 'guardar otra vez reemplaza'); assert.equal(c.pasos[5].texto, '# OGO N° 1\nTexto.', 'sin tocar la anterior')
assert.equal(C.cuantos(C.quitar(c, 5)), 2)
assert.equal(C.poner(c, paso(5), '   ').pasos[5], undefined, 'vacío = sacar')
assert.equal(C.cambiarDestino(c, 4, 'alumnos').pasos[4].destino, 'alumnos'); assert.equal(c.pasos[4].destino, 'solucion')
assert.equal(C.poner(C.vacia('X'), paso(4), RESP, { destino: 'alumnos' }).pasos[4].destino, 'alumnos', 'el profesor elige')

// lo «PARA EL PROFESOR» se va sumando
const notas = C.notasProfesor(c)
assert.deepEqual(notas.map((x) => x.n), [4, 7])
assert.match(notas[1].texto, /reserva en Pisiga/)

// para los pedidos
const pp = C.paraPedido(c, { excepto: 5 })
assert.match(pp, /^#### Paso 4 · CMOC: avenidas de aproximación y terreno clave \(🔒 SOLUCIÓN DEL PROFESOR · guardado \d\d\/10\/2026 \d\d:\d\d\)\n# CALCO MODIFICADO/)
assert.match(pp, /#### Paso 7 · Situación enemiga por fases \(🔒 SOLUCIÓN DEL PROFESOR/)
assert.doesNotMatch(pp, /#### Paso 5/)
assert.equal(C.paraPedido(C.vacia('X'), {}), '')
const chico = C.paraPedido(c, { limite: 3000 })
assert.ok(chico.length < 3000 + 1500 + 600, 'reparte el espacio: ' + chico.length)
assert.match(chico, /# OGO N° 1\nTexto\./, 'lo corto entra entero'); assert.match(chico, /recortado: \d+ caracteres más en la carpeta del profesor/)

// el .md: tres partes; ida y vuelta; aguanta «-->» en el texto
c = C.poner(c, paso(2), 'Límite norte --> río Lauca <!-- ojo -->', { ahora: '2026-10-10T22:20:00.000Z' })
const md = C.markdown(c, { escalon: 'Comandante de las FF.TT.', alumnos: 'Comandantes de Cuerpo de Ejército', foco: 'PMTD completo' })
assert.match(md, /^# 📕 Carpeta del profesor — EJERCICIO X\n/)
assert.match(md, /\*\*Escalón:\*\* Comandante de las FF\.TT\. · alumnos: Comandantes de Cuerpo de Ejército/)
assert.match(md, /## 1\. Para el profesor \(se va sumando paso a paso\)\n\n### Paso 4 · CMOC[^\n]*\n\n\* \*\*Destino de este documento[\s\S]*### Paso 7 · Situación enemiga por fases[^\n]*\n\nQue el G-2 vea la reserva en Pisiga\./)
assert.match(md, /## 2\. 🔒 Solución del profesor \(NO entregar a los alumnos\)\n\n### Paso 4[^\n]*\n\n# CALCO MODIFICADO[\s\S]*### Paso 7[^\n]*\n\nDESTINO: SOLUCIÓN DEL PROFESOR\n# CAE MÁS PROBABLE/)
assert.match(md, /## 3\. 📤 Lo que va a los alumnos\n\n### Paso 2[\s\S]*### Paso 5[^\n]*\n\n# OGO N° 1/)
assert.equal((md.match(/-->/g) || []).length, 3, 'el comentario de los datos se cierra una sola vez (más los dos del texto visible)')
const vuelta = C.leerMarkdown(md)
assert.deepEqual(vuelta, { ejercicio: c.ejercicio, pasos: c.pasos, actualizado: c.actualizado }, 'ida y vuelta')
assert.throws(() => C.leerMarkdown('# Un .md cualquiera'), /no es una carpeta del profesor/)

// juntar: de cada paso queda lo más nuevo
const vieja = C.poner(C.vacia('EJERCICIO X'), paso(4), '# viejo', { ahora: '2026-10-01T10:00:00.000Z' })
const j = C.juntar(vieja, c)
assert.equal(j.pasos[4].texto, RESP.trim()); assert.equal(C.cuantos(j), 4)
assert.equal(C.juntar(c, vieja).pasos[4].texto, RESP.trim(), 'lo viejo no pisa lo nuevo')

console.log(`carpeta-profesor.cjs OK — la respuesta real del CMOC (${RESP.length} caracteres): ${s.profesor.length} «PARA EL PROFESOR», 🔒 solución; carpeta de ${C.cuantos(c)} pasos, .md de ${md.length} caracteres ida y vuelta`)
