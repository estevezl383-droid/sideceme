// Ejercicio FICTICIO para la F3·P3 Formación inicial de las fuerzas (organizacion.cjs y
// e2e/organizacion.cjs), como el calco de la Escuela que mandó Sergio: una defensa propia
// frente a la FT-43 (FICT.), mecanizada y blindada, que ataca por la avenida del norte hacia
// los objetivos Oa y Ob. El G-2 ya marcó el CAE más probable y el más peligroso.
//   · Propias (como en su Organización de la Tarea): Caballería Mecanizada, Infantería
//     Andina, Artillería, Ingeniería y Comunicaciones (regimientos: 9 compañías genéricas
//     cada uno) y un batallón logístico.
//   · Enemigo: 2 batallones mecanizados y 1 blindado de la FT-43, con su grupo de artillería.
//   · En la carta ya hay una tarea táctica del análisis de la misión (sin operación).
const { ejercicioRiesgo } = require('./riesgo-ejercicio.js')

const u = (id, bando, designacion, arma, escalon, lng, lat) => ({ id, tipo: 'unidad', bando, designacion, arma, escalon, lng, lat })
const PROPIAS = [
  u('p-cab', 'propias', 'RC-4 «VARGAS» (FICT.)', 'cabmec', 'regimiento', -68.36, -16.98),
  u('p-and', 'propias', 'RI-21 «TORREZ» (FICT.)', 'andina', 'regimiento', -68.3, -16.99),
  u('p-art', 'propias', 'RA-1 «LANZA» (FICT.)', 'artilleria', 'regimiento', -68.27, -16.99),
  u('p-ing', 'propias', 'BING-2 «AGUIRRE» (FICT.)', 'ingenieria', 'regimiento', -68.24, -16.98),
  u('p-com', 'propias', 'RCOM-1 (FICT.)', 'comunicaciones', 'regimiento', -68.22, -16.99),
  u('p-log', 'propias', 'BLOG-2 (FICT.)', 'logistica', 'batallon', -68.2, -17.0),
]
const ENEMIGAS = [
  u('e-bim1', 'enemigo', 'BIM-431 (FICT.)', 'mecanizada', 'batallon', -68.31, -16.8),
  u('e-bim2', 'enemigo', 'BIM-432 (FICT.)', 'mecanizada', 'batallon', -68.29, -16.79),
  u('e-bt', 'enemigo', 'BT-433 (FICT.)', 'blindada', 'batallon', -68.4, -16.81),
  u('e-ga', 'enemigo', 'GA-43 (FICT.)', 'artilleria', 'grupo', -68.3, -16.74),
]

function ejercicioOrganizacion() {
  const e = ejercicioRiesgo()
  e.nombre = 'PRUEBA FORMACIÓN INICIAL (FICT.)'
  e.unidades = [...PROPIAS, ...ENEMIGAS].map((x) => ({ ...x }))
  e.ordenSup = { ...e.ordenSup, intencion: 'Desgastar a la FT-43 (FICT.) en la zona de seguridad y destruirla al sur de la LF. TRUENO (FICT.).' }
  e.picb = {
    ht18: { _marca: { 'CAE N° 1 — Ataque frontal por la avenida norte (FICT.)': 'MÁS PROBABLE', 'CAE N° 2 — Envolvimiento por el oeste (FICT.)': 'MÁS PELIGROSO' } },
    cae: { Misión: 'La FT-43 (FICT.) ataca a partir del D (0500) para conquistar Oa y Ob (FICT.).', Maniobra: 'Ataque frontal con dos batallones mecanizados en primer escalón.' },
  }
  e.cmoc = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], desplazamientos: [], avenidas: [{ coords: [[-68.3, -16.72], [-68.3, -16.9]], bando: 'enemigo' }, { coords: [[-68.42, -16.75], [-68.38, -16.92]], bando: 'enemigo' }] }
  e.g3 = { ...e.g3, mision: { 'ENUNCIADO COMPLETO DE LA MISIÓN': 'La DIV.MEC.-1 (FICT.) defiende a partir del D (0500) hasta el D+1 (1800) en el AO. PUEBLO-X (FICT.) para desgastar y destruir a la FT-43 (FICT.).' } }
  e.ops = {
    ...e.ops,
    objetivos: [
      { centro: [-68.3, -16.86], clase: 'intermedio', etiqueta: 'Oa' },
      { centro: [-68.27, -16.93], clase: 'final', etiqueta: 'Ob' },
    ],
    maniobra: [{ coords: [[-68.3, -16.76], [-68.3, -16.86]], etiqueta: 'EP', clase: 'principal', forma: 'frontal' }],
    // Una tarea del análisis de la misión, sin operación todavía.
    tareas: [{ centro: [-68.2, -16.95], tarea: 'controlar', escalon: 'batallon', rot: 0, escala: 1 }],
  }
  e.orgTarea = []
  return e
}

module.exports = { ejercicioOrganizacion, PROPIAS, ENEMIGAS }
