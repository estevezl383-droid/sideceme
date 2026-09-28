// Ejercicio de PRUEBA con unidades FICTICIAS (ninguna es una unidad real).
// Lo usan las pruebas de Node y las de Chromium (e2e/). No es un escenario
// doctrinario: sólo arma los datos que la Mesa guarda en un ejercicio.
//
//   node ejercicio-ficticio.js > ejercicio.json   → lo imprime como JSON

// Las piezas se arman igual que la Mesa (tN): id «<unidad>-<n>», dos escalones
// abajo y el símbolo abreviado de su arma. Se escriben a mano para que el
// ejercicio sea un dato fijo, como uno guardado por una versión anterior.
const SIMBOLO = { infanteria: ['infanteria', 'INF'], caballeria: ['cab_blindada', 'CAB BL'], artilleria: ['artilleria', 'ART'], ingenieria: ['ingenieros', 'ING'] }
const DOS_ABAJO = { batallon: 'seccion', regimiento: 'compania' }

function pieza(u, n) {
  const [simbolo, corto] = SIMBOLO[u.arma]
  return { id: `${u.id}-${n}`, de: u.id, simbolo, escalon: DOS_ABAJO[u.escalon], madre: u.designacion, nom: `${corto} ${n}` }
}

function unidad(id, designacion, arma, escalon, lat, lng, piezas = 3) {
  return { id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat, lng, piezas }
}

function ejercicioFicticio({ conPlantilla = true } = {}) {
  const alfa = unidad('fict-alfa', 'B.I. «ALFA» (FICT.)', 'infanteria', 'batallon', -17.012, -65.072)
  const bravo = unidad('fict-bravo', 'R.C. «BRAVO» (FICT.)', 'caballeria', 'regimiento', -17.018, -65.035)
  const charlie = unidad('fict-charlie', 'G.A. «CHARLIE» (FICT.)', 'artilleria', 'batallon', -17.036, -65.052)
  const delta = unidad('fict-delta', 'B. ING. «DELTA» (FICT.)', 'ingenieria', 'batallon', -17.040, -65.083)
  const area = [
    [-65.1, -16.98],
    [-65.0, -16.98],
    [-65.0, -17.05],
    [-65.1, -17.05],
  ]
  const datos = {
    version: 1,
    nombre: 'EJEMPLO FICTICIO',
    guardadoEn: '2026-09-01T12:00:00.000Z',
    pais: 'bolivia',
    unidades: [alfa, bravo, charlie, delta],
    ops: {
      limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [],
      magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [],
      areaOps: {
        coords: area,
        frente: [area[0], area[1]],
        tipo: 'defensiva',
        modalidad: 'tenaz',
        ambiente: 'llano',
        frenteM: 10620,
        profM: 7780,
        azimut: 0,
      },
    },
    // Organización de la tarea «de antes»: sin el campo `clase` (sólo `ft`) y
    // con los identificadores que tenía. Tiene que seguir abriendo igual.
    orgTarea: [
      {
        id: 'ag-1700000000000-0',
        nombre: 'FT «ÁGUILA» (FICT.)',
        escalon: 'batallon',
        operacion: 'od',
        tarea: '',
        proposito: '',
        ft: true,
        piezas: [pieza(alfa, 1), pieza(alfa, 2), pieza(bravo, 1)],
      },
      {
        id: 'ag-1700000000000-1',
        nombre: 'AGRUPACIÓN «CÓNDOR» (FICT.)',
        escalon: 'compania',
        operacion: 'oc1',
        tarea: '',
        proposito: '',
        ft: false,
        piezas: [pieza(alfa, 3)],
      },
    ],
  }
  if (conPlantilla) {
    // Un arco de apoyo enemigo (ficticio) que tapa el centro del área: es donde
    // se traza el plan de barreras en la prueba del 3D.
    datos.plantilla = {
      ok: true,
      resumen: { bando: 'enemigo' },
      conos: [
        {
          nom: 'ARCO FICTICIO',
          pieza: 'Pieza ficticia',
          calibre: 105,
          alcanceKm: 11,
          alcanzaAdelanteKm: 6,
          fuente: 'Dato de prueba',
          nota: 'Dato de prueba',
          rotulo: 'ARCO FICT.',
          principal: true,
          coords: [
            [-65.095, -16.985],
            [-65.005, -16.985],
            [-65.005, -17.045],
            [-65.095, -17.045],
            [-65.095, -16.985],
          ],
        },
      ],
      bandas: [],
      marcas: [],
      lineas: [],
    }
  }
  return datos
}

module.exports = { ejercicioFicticio, pieza, unidad }

if (require.main === module) process.stdout.write(JSON.stringify(ejercicioFicticio(), null, 2) + '\n')
