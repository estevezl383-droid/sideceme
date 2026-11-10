// node calcos/pruebas/cae-organigrama.mjs — mover objetivos, CAE-1/CAE-2 de la H.T. 17, organigrama del CE (10-11-2026).
import assert from 'node:assert/strict'
import { moverObjetivo, avisoMovido } from '../objetivos-indicados/v1/mover.mjs'
import { caeDeManiobra, llenarHT17, vaciarHT17, FACTORES, claveCelda } from '../cae-enemigo/v1/formas-cae.mjs'
import { ponerOrganigrama, madrePropia, fichaColocada, PLANTILLA_CE, dependientesDe } from '../organizacion/v1/organigrama.mjs'
let n = 0
const caso = (t, f) => { f(); n++; console.log('✓', t) }

const ops = {
  objetivos: [
    { etiqueta: 'Oa', clase: 'intermedio', centro: [-68.5, -17.5], apoyadoEn: 'C4', nom: 'Terreno clave C4' },
    { etiqueta: 'O1', clase: 'final', centro: [-68.3, -17.4], apoyadoEn: '', nom: 'OBJETIVO FINAL' },
  ],
  maniobra: [
    { forma: 'envolvimiento', cae: 'CAE-1', coords: [], hacia: 'O1' },
    { forma: 'frontal', cae: 'CAE-2', coords: [], hacia: 'Oa' },
  ],
}
const claves = [{ etiqueta: 'C13', centro: [-68.2, -17.45] }, { etiqueta: 'C4', centro: [-68.5, -17.5] }]
caso('mover: el objetivo toma el terreno clave cercano y rehace las flechas por grupo con su CAE', () => {
  const llamadas = []
  const r = moverObjetivo(ops, 1, [-68.201, -17.451], { claves, plantilla: { ok: true }, rehacer: (p, objs, forma) => (llamadas.push(forma), { ok: true, flechas: [{ forma, hacia: objs[1].etiqueta, centroFinal: objs[1].centro }] }) })
  assert.deepEqual(r.ops.objetivos[1].centro, [-68.201, -17.451])
  assert.equal(r.ops.objetivos[1].apoyadoEn, 'C13')
  assert.equal(r.ops.objetivos[1].nom, 'OBJETIVO FINAL · terreno clave C13')
  assert.deepEqual(llamadas, ['envolvimiento', 'frontal'])
  assert.deepEqual(r.ops.maniobra.map((f) => f.cae), ['CAE-1', 'CAE-2'])
  assert.equal(r.ops.objetivos[0], ops.objetivos[0])
  assert.match(avisoMovido(r), /O1 movido.*C13.*2 forma/)
})
caso('mover: lejos del terreno clave lo pierde; sin plantilla deja las flechas', () => {
  const r = moverObjetivo(ops, 0, [-69, -18], { claves })
  assert.equal(r.ops.objetivos[0].apoyadoEn, '')
  assert.equal(r.ops.objetivos[0].nom, 'Objetivo intermedio')
  assert.equal(r.ops.maniobra, ops.maniobra)
  assert.match(avisoMovido(r), /Ya no está sobre el terreno clave C4/)
})
caso('mover: índice o punto inválido no cambia nada', () => {
  assert.equal(moverObjetivo(ops, 7, [0, 0]).ops, ops)
  assert.equal(moverObjetivo(ops, 0, [NaN, 1]).ops, ops)
})

const forma = { id: 'doble', nom: 'DOBLE ENVOLVIMIENTO' }
caso('H.T. 17: caeDeManiobra lee qué forma es cada CAE', () => {
  assert.deepEqual(caeDeManiobra(ops.maniobra), { envolvimiento: 'CAE-1', frontal: 'CAE-2' })
})
caso('H.T. 17: llena la columna del CAE con la forma y los objetivos, sin pisar lo escrito', () => {
  const v0 = { ht17: { [claveCelda(FACTORES[2], 'CAE-2')]: 'lo escribí yo' } }
  const { cambios, mantenidas } = llenarHT17(v0, 'CAE-2', forma, { objetivos: ops.objetivos })
  assert.equal(mantenidas, 1)
  assert.equal(cambios.ht17[`${FACTORES[0]}|CAE-2`].startsWith('«DOBLE ENVOLVIMIENTO» — '), true)
  assert.match(cambios.ht17[`${FACTORES[0]}|CAE-2`], /O1/)
  assert.equal(cambios.ht17[`${FACTORES[2]}|CAE-2`], 'lo escribí yo')
  assert.equal(cambios.ht17[FACTORES[0]], undefined)
  const v1 = { ...v0, ...cambios }
  const r2 = llenarHT17(v1, 'CAE-2', { id: 'frontal', nom: 'ATAQUE FRONTAL' }, { objetivos: [] })
  assert.match(r2.cambios.ht17[`${FACTORES[0]}|CAE-2`], /^«ATAQUE FRONTAL»/)
  assert.equal(r2.mantenidas, 1)
  const c1 = llenarHT17({}, 'CAE-1', forma, {}).cambios
  assert.match(c1.ht17[FACTORES[3]], /PREFIERE/)
})
caso('H.T. 17: quitar el CAE borra sólo lo automático', () => {
  const v = { ht17: { [FACTORES[0]]: 'mío' } }
  const c = llenarHT17(v, 'CAE-1', forma, {}).cambios
  const w = vaciarHT17({ ...v, ...c }, 'CAE-1').cambios
  assert.equal(w.ht17[FACTORES[0]], 'mío')
  assert.equal(w.ht17[FACTORES[1]], '')
  assert.deepEqual(w._ht17auto, {})
})

const us = [
  { id: 1, bando: 'propias', tipo: 'unidad', escalon: 'cuerpo', designacion: 'CE-II', lat: -17, lng: -68 },
  { id: 2, bando: 'enemigo', tipo: 'unidad', escalon: 'brigada', designacion: 'G. BLIN. 9' },
  { id: 3, bando: 'propias', tipo: 'unidad', escalon: 'division', designacion: 'DIV-1', dependeDe: 1, lat: -17.1, lng: -68 },
]
caso('organigrama: la madre es la que nombra la Orden (CE - II)', () => {
  assert.equal(madrePropia(us, 'CE - II').id, 1)
  assert.equal(madrePropia(us, '').id, 1)
  assert.equal(madrePropia([us[1]], 'CE-II'), null)
})
caso('organigrama: ⚡ pone las que faltan bajo el CE, que queda PC, sin duplicar DIV-1', () => {
  const r = ponerOrganigrama(us, 1, PLANTILLA_CE, { base: 1000 })
  assert.equal(r.nuevas.length, PLANTILLA_CE.length - 1)
  assert.ok(r.nuevas.every((u) => u.dependeDe === 1 && u.bando === 'propias' && Number.isFinite(u.lat)))
  const ce = r.unidades.find((u) => u.id === 1)
  assert.equal(ce.tipo, 'pc')
  assert.equal(ce.disgregada.puestas.length, r.nuevas.length)
  assert.equal(ce.disgregada.tipoAntes, 'unidad')
  assert.equal(dependientesDe(r.unidades, 1).length, PLANTILLA_CE.length)
  assert.equal(r.nuevas.find((u) => u.designacion === 'RGTO. ART. 100').reducida, true)
  assert.equal(r.nuevas.find((u) => u.designacion === 'BAT. C Y S 100').textoSimbolo, 'C Y S')
  const r2 = ponerOrganigrama(r.unidades, 1, PLANTILLA_CE)
  assert.equal(r2.unidades, null)
})
caso('colocar: Depende de sólo para propias', () => {
  assert.equal(fichaColocada({ bando: 'propias', dependeDe: 1 }).dependeDe, 1)
  assert.equal('dependeDe' in fichaColocada({ bando: 'enemigo', dependeDe: 1 }), false)
  assert.equal('dependeDe' in fichaColocada({ bando: 'propias', dependeDe: '' }), false)
})
console.log(`${n} casos OK`)
