// Ejercicio de PRUEBA para el tablero del G-4 (calcos/fichas-instalacion/v2) y la propuesta
// del ASDI con la PICB (calcos/logistica/v1/asdi-picb.js). Todo FICTICIO: la División en la
// defensa de logistica-ejemplo.js más
//   · la FT «TORREZ» (agrupación consolidada: un batallón y una compañía de infantería, una
//     compañía de tanques y una sección de morteros) en el esfuerzo principal;
//   · el CMOC del G-2: un pantano (terreno severo), un monte (restringido), una avenida de
//     aproximación enemiga y un corredor de movilidad propio;
//   · el ASDI elegido con los puestos del Batallón Logístico (Cl I, III, V, agua, laboratorio,
//     mantenimiento) y un Puesto de Distribución Clase V Avanzado en el área de trenes.
const { ejercicioLogistica, cuadrado } = require('./logistica-ejemplo.js')

const ASDI = cuadrado(-68.36, -17.0, 2.8)
const TRENES_FT = cuadrado(-68.335, -16.9, 1.2)
const poligono = (clase, ring) => ({ type: 'Feature', properties: { _clase: clase, _origen: 'manual' }, geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] } })

function ejercicioTablero() {
  const ex = ejercicioLogistica({ conPropuestas: false })
  ex.nombre = 'PRUEBA TABLERO G-4 (FICT.)'
  ex.unidades.push({
    id: 'ag-torrez', bando: 'propias', tipo: 'unidad', designacion: 'FT «TORREZ»', arma: 'infanteria', escalon: 'regimiento', lat: -16.87, lng: -68.33,
    agId: 'ag-1', esFT: true, agrupacion: true, esAgrupacion: true, operacionAg: 'od', tareaAg: 'defender',
    piezasAg: [
      { id: 'p1', simbolo: 'infanteria', escalon: 'batallon', nom: 'INF 1' },
      { id: 'p2', simbolo: 'infanteria', escalon: 'compania', nom: 'INF 2' },
      { id: 'p3', simbolo: 'blindaje', escalon: 'compania', nom: 'BL 1' },
      { id: 'p4', simbolo: 'morteros', escalon: 'seccion', nom: 'MORT 1' },
    ],
  })
  const inst = (id, instalacion, lng, lat, extra = {}) => ({ id, lat, lng, bando: 'propias', tipo: 'instalacion', instalacion, escalon: 'seccion', arma: 'logistica', designacion: '', futura: false, agrupacion: false, origen: 'plantilla-asdi', areaLog: 'asdi-fict', ...extra })
  ex.unidades.push(
    inst('i-cl1', 'pd_cl1', -68.355, -17.005),
    inst('i-agua', 'pd_agua', -68.35, -17.01),
    inst('i-cl3', 'pd_cl3', -68.345, -17.005),
    inst('i-cl5', 'pd_cl5m', -68.34, -17.012),
    inst('i-lab', 'p_lab', -68.35, -17.018),
    inst('i-mant', 'pmant_mov', -68.342, -17.02),
    inst('i-cl5avz', 'pd_cl5_avz', -68.332, -16.9085, { areaLog: 'at-ft', origen: '' }),
  )
  ex.ops.zonasLog.push({ zona: 'asdi', division: 1, clave: 'asdi-fict', coords: ASDI, elegida: true, propuesta: 'A' }, { zona: 'atcomb', division: 1, clave: 'at-ft', coords: TRENES_FT })
  ex.cmoc = {
    severo: [poligono('severo', [[-68.5, -17.05], [-68.42, -17.05], [-68.42, -17.15], [-68.5, -17.15]])],
    restringido: [poligono('restringido', [[-68.22, -16.98], [-68.12, -16.98], [-68.12, -17.1], [-68.22, -17.1]])],
    avenidas: [{ coords: [[-68.1, -16.78], [-68.12, -16.95], [-68.15, -17.15]], ancho: 'medio', bando: 'enemigo' }],
    corredores: [{ coords: [[-68.33, -17.4], [-68.33, -16.86]], escalon: 'division', bando: 'propio' }],
    clave: [{ centro: [-68.3, -16.9], etiqueta: 'C1' }],
    defensivo: [],
    ae: [],
    desplazamientos: [],
  }
  return ex
}

module.exports = { ejercicioTablero, ASDI, TRENES_FT }
