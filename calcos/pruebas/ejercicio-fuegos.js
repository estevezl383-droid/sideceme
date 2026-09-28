// Ejercicio de PRUEBA del plan de fuegos, con unidades FICTICIAS: el mismo de
// ejercicio-ficticio.js más una FT que lleva una batería de artillería
// (consolidada como ficha en el calco) y dos fichas enemigas, una cerca y otra
// lejos del alcance de la artillería propia.
const { ejercicioFicticio, pieza } = require('./ejercicio-ficticio')

function ejercicioFuegos({ conPlantilla = true } = {}) {
  const d = ejercicioFicticio({ conPlantilla })
  d.nombre = 'EJEMPLO FUEGOS'
  const [alfa, bravo, charlie] = d.unidades
  const ft = d.orgTarea[0]
  ft.piezas = [pieza(alfa, 1), pieza(alfa, 2), pieza(bravo, 1), pieza(charlie, 1)]
  ft.consolidada = true
  d.unidades.push({
    id: 'fict-ft-aguila',
    bando: 'propias',
    tipo: 'unidad',
    escalon: 'batallon',
    arma: 'infanteria',
    designacion: 'FT «ÁGUILA» (FICT.)',
    agId: ft.id,
    esFT: true,
    agrupacion: true,
    esAgrupacion: true,
    piezasAg: ft.piezas,
    lat: -17.03,
    lng: -65.02,
  })
  d.unidades.push(
    { id: 'fict-eno-cerca', bando: 'enemigo', tipo: 'unidad', designacion: 'CÍA. MORT. (FICT.)', arma: 'morteros', escalon: 'compania', lat: -16.99, lng: -65.03 },
    { id: 'fict-eno-lejos', bando: 'enemigo', tipo: 'unidad', designacion: 'CÍA. LOG. (FICT.)', arma: 'logistica', escalon: 'compania', lat: -16.75, lng: -65.05 },
  )
  return d
}

module.exports = { ejercicioFuegos }
