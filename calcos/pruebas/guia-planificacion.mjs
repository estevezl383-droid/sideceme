// La Guía de Planificación del Comandante (F2·P15) con el formato del PMTD 2017
// (calcos/guia-planificacion/v1/guia.mjs): la hoja y la lectura de lo escrito con el cuadro viejo.
//   node guia-planificacion.mjs
import assert from 'node:assert/strict'
import { HOJA_GUIA_PLANIFICACION as P, leerGuia, parrafoDe } from '../guia-planificacion/v1/guia.mjs'

let fallas = 0
const caso = (nombre, fn) => {
  try {
    fn()
    console.log(`  ✔ ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  ✘ ${nombre}\n      ${String(e.message).split('\n').join('\n      ')}`)
  }
}
const fila = (a, g, o = '') => ({ 'Área / Sección': a, 'Guía impartida': g, 'Observación': o })

caso('F2·P15: los trece párrafos del PMTD 2017, en orden, cada uno con su ayuda', () => {
  assert.equal(P.tipo, 'campos')
  assert.deepEqual(P.campos, ['I.- LA OPERACIÓN DECISIVA', 'II.- CURSOS DE ACCIÓN PROPIOS Y DEL ENEMIGO PARA SER CONSIDERADOS', 'III.- REQUERIMIENTOS CRÍTICOS DE INFORMACIÓN DEL COMANDANTE (RCIC)', 'IV.- LA GUÍA DE RECONOCIMIENTO', 'V.- RIESGO', 'VI.- ENGAÑO MILITAR', 'VII.- APOYO DE FUEGOS', 'VIII.- APOYO DE INGENIERÍA (MOVILIDAD/CONTRA MOVILIDAD)', 'IX.- MEDIDAS DE SEGURIDAD', 'X.- PLAN DE TIEMPO', 'XI.- TIPO DE ORDEN QUE SE DEBE DISTRIBUIR', 'XII.- TIPO DE ENSAYO QUE SE DEBERÁ LLEVAR A CABO', 'XIII.- PRIORIDADES DE APOYO DE SERVICIO DE COMBATE'])
  for (const c of P.campos) {
    assert.ok(P.ayudaCampos[c], `sin ayuda: ${c}`)
    assert.ok(P.ayudaIA.includes(`"${c}"`), `la IA no sabe qué va en ${c}`)
  }
  assert.equal(P.id, 'guiaPlanificacion')
  assert.equal(P.num, 'F2·P15')
})

caso('Los renglones del Word del CE-I, cada uno en su párrafo', () => {
  const p = (a) => parrafoDe(P, fila(a, 'x')).split('.- ')[0]
  assert.equal(p('Apreciación y Método'), 'II')
  assert.equal(p('Inteligencia (G-2)'), 'III')
  assert.equal(p('Operaciones (G-3)'), 'I')
  assert.equal(p('Logística (G-4)'), 'XIII')
  assert.equal(p('Personal (G-1)'), 'XIII')
  assert.equal(p('Asuntos Civiles y Gobierno Militar (G-5)'), 'XIII')
  assert.equal(p('Ingeniería (EME)'), 'VIII')
  assert.equal(p('Apoyo de Fuegos / Artillería (EME)'), 'VII')
  assert.equal(p('Comunicaciones (EME)'), 'IX')
  assert.equal(p('Defensa Antiaérea (EME)'), 'VII')
  assert.equal(p('Reconocimiento'), 'IV')
  assert.equal(p('Engaño'), 'VI')
  assert.equal(p('Plan de tiempo'), 'X')
  // Sin área: por lo que dice el renglón; sin nada reconocible, al I.
  assert.equal(parrafoDe(P, fila('', 'Ensayo de comandantes el D-5')).split('.- ')[0], 'XII')
  assert.equal(parrafoDe(P, fila('Otros', 'Algo')).split('.- ')[0], 'I')
})

caso('La hoja guardada como lista: nada se pierde y dos renglones del mismo párrafo se juntan', () => {
  const v = leerGuia(P, [fila('Logística (G-4)', 'Clase III y V.', 'Prever +20 % de diésel.'), fila('Personal (G-1)', 'Aclimatación de 5 días.'), fila('Operaciones (G-3)', ''), {}])
  assert.deepEqual(v, { 'XIII.- PRIORIDADES DE APOYO DE SERVICIO DE COMBATE': 'Clase III y V. Observación: Prever +20 % de diésel.\n\nAclimatación de 5 días.' })
})

caso('Escrito encima de la lista («0», «1»… + párrafos): lo del párrafo manda, lo viejo va a los vacíos', () => {
  const v = leerGuia(P, { 0: fila('Ingeniería', 'ZO-1.'), 1: fila('Fuegos', 'Contrabatería.'), 'VII.- APOYO DE FUEGOS': 'Lo nuevo.', punt: { x: 1 } })
  assert.deepEqual(v, { 'VII.- APOYO DE FUEGOS': 'Lo nuevo.', 'VIII.- APOYO DE INGENIERÍA (MOVILIDAD/CONTRA MOVILIDAD)': 'ZO-1.', punt: { x: 1 } })
})

caso('Lo que no es del cuadro viejo no se toca (null)', () => {
  assert.equal(leerGuia(P, { 'I.- LA OPERACIÓN DECISIVA': 'x' }), null)
  assert.equal(leerGuia(P, null), null)
  assert.equal(leerGuia({ id: 'guiaInicial', tipo: 'filas' }, [fila('a', 'b')]), null)
  assert.equal(leerGuia({ id: 'guiaFinal', tipo: 'campos' }, [fila('a', 'b')]), null)
  assert.equal(leerGuia({ ...P, tipo: 'filas' }, [fila('a', 'b')]), null)
})

console.log(fallas ? `\n${fallas} caso(s) fallan.` : '\nTodos los casos pasan.')
process.exit(fallas ? 1 : 0)
