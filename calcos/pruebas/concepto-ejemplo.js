// Un ejercicio FICTICIO con la forma del de Sergio (Defensa de área del CE-I en el AO LAUCA): el Área de
// Operaciones con la frontera al oeste, tres avenidas de aproximación del CMOC (AA-1 al norte, AA-3 al
// centro, AA-2 al sur), las A.I.N. de la H.T. 20, la 1ª Br. Ac. y su artillería al oeste, el CE-I
// disgregado (DIV MEC-2, DIV-1, DIV-6, GALM-1, RAM-4) y el nomenclátor de los lugares que nombra el
// concepto. Las coordenadas son aproximadas: es para probar, no es la carta.
const path = require('path')
const fs = require('fs')

const HOJA = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'concepto-ce-i.json'), 'utf8'))

// [lng, lat]
const LUGARES = [
  ['Ungallire', -69.02, -18.47],
  ['Guata', -68.97, -18.49],
  ['Estancia Esmeralda', -68.86, -18.36],
  ['Cerro Sacabaya', -68.84, -18.56],
  ['Turco', -68.3, -18.5],
  ['Huachacalla', -68.28, -18.78],
  ['Julo', -68.93, -18.8],
  ['Bella Vista', -68.55, -18.82],
  ['Macaya', -68.68, -18.47],
  ['Estancia Ticanani', -68.5, -18.55],
  ['Putre', -69.55, -18.2],
  ['Guallatire', -69.2, -18.5],
].map(([nom, lng, lat]) => ({ nom, clase: 'poblacion', c: [lng, lat] }))

const linea = (lat0, lat1, desde = -69.4, hasta = -68.15) => {
  const c = []
  for (let k = 0; k <= 12; k++) {
    const t = k / 12
    c.push([+(desde + (hasta - desde) * t).toFixed(4), +(lat0 + (lat1 - lat0) * t).toFixed(4)])
  }
  return c
}

// conClaves: los lugares van también como terreno clave del CMOC (en la Mesa de prueba no hay calcos del terreno).
function ejercicioConcepto({ nombre = 'PRUEBA CONCEPTO CE-I (FICT.)', conTexto = true, conClaves = true } = {}) {
  const u = (id, designacion, arma, escalon, lat, lng, bando = 'propias') => ({ id, bando, tipo: 'unidad', designacion, arma, escalon, lat, lng, piezas: 3 })
  const ao = [[-69.1, -18.3], [-69.1, -18.9], [-68.2, -18.9], [-68.2, -18.3], [-69.1, -18.3]]
  return {
    version: 1,
    nombre,
    guardadoEn: '2026-10-22T12:00:00.000Z',
    pais: 'bolivia',
    autorEM: 'My. PRUEBA (FICT.)',
    unidades: [
      u('pc-ce', 'CE-I', 'infanteria', 'cuerpo', -18.55, -68.4),
      u('divmec2', 'DIV MEC-2', 'mecanizada', 'division', -18.42, -68.7),
      u('div1', 'DIV-1', 'infanteria', 'division', -18.76, -68.7),
      u('div6', 'DIV-6', 'infanteria', 'division', -18.6, -68.45),
      u('galm1', 'GALM-1', 'lanzacohetes', 'batallon', -18.52, -68.55),
      u('ram4', 'RAM-4', 'artilleria', 'regimiento', -18.5, -68.72),
      u('e-br1', '1ª BR. AC. «CORACEROS»', 'blindada', 'brigada', -18.45, -69.35, 'enemigas'),
      u('e-gaap', 'GAAP N° 4 «MIRAFLORES»', 'artilleria', 'batallon', -18.4, -69.45, 'enemigas'),
    ],
    orgTarea: [],
    fasesCOA: { propio: [], enemigo: [] },
    ordenSup: { escalonSuperior: 'FF.TT.T.O. (FICT.)', unidad: 'CE-I', mision: 'El CE-I defiende el AO LAUCA a partir del D (0400) hasta el D+15 (1800).' },
    documentos: [],
    g3: conTexto ? { concepto: HOJA } : {},
    hojasG: { g1: {}, g4: {}, g5: {} },
    cmoc: {
      restringido: [], severo: [], clave: conClaves ? LUGARES.map((l, i) => ({ centro: l.c, etiqueta: `C${i + 1}`, razon: l.nom })) : [], defensivo: [], ae: [], corredores: [], desplazamientos: [],
      avenidas: [
        { coords: linea(-18.45, -18.5), escalon: 'division', nombre: 'AA-1' },
        { coords: linea(-18.78, -18.8), escalon: 'brigada', nombre: 'AA-2' },
        { coords: linea(-18.6, -18.62), escalon: 'brigada', nombre: 'AA-3' },
      ],
    },
    ops: {
      limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], objetivos: [], maniobra: [],
      ains: [
        { n: 2, nom: 'AIN-2', centro: [-69.3, -18.45], forma: 'punto' },
        { n: 3, nom: 'AIN-3', centro: [-69.2, -18.5], forma: 'punto' },
        { n: 5, nom: 'AIN-5', centro: [-69.0, -18.8], forma: 'punto' },
      ],
      areaOps: { coords: ao, frente: [ao[0], ao[1]] },
    },
    picb: {},
  }
}

module.exports = { ejercicioConcepto, LUGARES, HOJA }
