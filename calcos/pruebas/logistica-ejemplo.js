// Ejercicio de PRUEBA para el módulo de logística del G-4 (calcos/logistica/v1), con
// unidades y lugares FICTICIOS. Una División en la defensa:
//   · el Área de Operaciones (el primer lado, al norte, es el frente / LPR), las fichas
//     propias (tres regimientos y la artillería) y una brigada enemiga al norte;
//   · el ARCE del Cuerpo de Ejército (referencia), un EPA y un EPE;
//   · las fases del COA, el concepto de apoyo de las dos primeras y la misión de logística;
//   · hojas del G-4 ya trabajadas: tareas (F2·P3), suposiciones (F2·P6) y ventajas y
//     desventajas de cada CAP (F5·P1).
// Con `conPropuestas`, las áreas A y B ya están trazadas (para el teléfono).
// También trae RESPUESTAS DE IA de ejemplo (evaluación, apreciación y matriz).
const cuadrado = (lng, lat, km) => {
  const dl = km / (111.32 * Math.cos((lat * Math.PI) / 180))
  const dt = km / 110.574
  return [[lng, lat], [lng + dl, lat], [lng + dl, lat - dt], [lng, lat - dt]]
}
const AREA_A = cuadrado(-68.35, -16.95, 2.6)
const AREA_B = cuadrado(-68.25, -17.15, 2.8)
const ARCE = cuadrado(-68.3, -17.35, 3.3)

function ejercicioLogistica({ conPropuestas = false } = {}) {
  const u = (id, designacion, arma, escalon, lat, lng) => ({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat, lng, piezas: 3 })
  const zonasLog = [{ zona: 'arce', division: 1, clave: 'arce-fict', coords: ARCE }]
  if (conPropuestas) zonasLog.push({ zona: 'asdi', division: 1, clave: 'asdi-a', propuesta: 'A', coords: AREA_A }, { zona: 'asdi', division: 2, clave: 'asdi-b', propuesta: 'B', coords: AREA_B })
  return {
    version: 1,
    nombre: `PRUEBA LOGÍSTICA${conPropuestas ? ' B' : ''} (FICT.)`,
    guardadoEn: '2026-09-01T12:00:00.000Z',
    pais: 'bolivia',
    autorEM: 'My. PRUEBA (FICT.)',
    unidades: [
      u('l-alfa', 'RI-1 «ALFA» (FICT.)', 'infanteria', 'regimiento', -16.85, -68.4),
      u('l-bravo', 'RCB-2 «BRAVO» (FICT.)', 'blindada', 'regimiento', -16.86, -68.2),
      u('l-charlie', 'RIM-3 «CHARLIE» (FICT.)', 'mecanizada', 'regimiento', -17.05, -68.3),
      u('l-delta', 'RA-1 «DELTA» (FICT.)', 'artilleria', 'regimiento', -16.95, -68.28),
      { id: 'l-rojo', bando: 'enemigas', tipo: 'unidad', designacion: 'BRIG. BL. ROJA (FICT.)', arma: 'blindada', escalon: 'brigada', lat: -16.7, lng: -68.3 },
    ],
    orgTarea: [],
    fasesCOA: { propio: [{ nombre: 'OCUPACIÓN (FICT.)' }, { nombre: 'DEFENSA (FICT.)' }, { nombre: 'CONTRAATAQUE (FICT.)' }], enemigo: [] },
    conceptoApoyo: [
      { nombre: 'OCUPACIÓN (FICT.)', enfoque: ['cl4', 'cl5'], prioridad: 'RI-1 «ALFA», RCB-2 «BRAVO» (FICT.)', distribucion: 'domicilio' },
      { nombre: 'DEFENSA (FICT.)', enfoque: ['cl5', 'evacuacion'], prioridad: 'RCB-2 «BRAVO» (FICT.)' },
    ],
    misionLog: 'Los elementos de apoyo de servicio de combate de la DIV.MEC.-1 (FICT.) proporcionan apoyo logístico a partir del D-5 hasta el D+1 en el AO. PUEBLO-X (FICT.), con el propósito de mantener la defensa.',
    ordenSup: {
      escalonSuperior: 'I CUERPO DE EJÉRCITO (FICT.)',
      unidad: 'DIV.MEC.-1 (FICT.)',
      puestoMando: 'CG. PUEBLO-X',
      vigencia: 'D-15 (2300)',
      clave: 'xyz',
      numero: '3',
      clasificacion: 'RESERVADO',
      carta: 'Especial PUEBLO-X (FICT.), Esc. 1:250.000',
      mision: 'La DIV.MEC.-1 (FICT.) defiende el AO. PUEBLO-X (FICT.) a partir del D (0500) hasta el D+1 (1800).',
    },
    documentos: [{ nombre: 'Orden de operaciones (FICT.).pdf', categoria: 'orden', texto: 'ORDEN DE OPERACIONES N° 3 (FICT.). La DIV.MEC.-1 (FICT.) defiende el AO. PUEBLO-X. El CE mantiene el ARCE al sur.' }],
    g3: {},
    hojasG: {
      g1: {},
      g4: {
        tareas: [
          { Tarea: 'Apoyar logísticamente la defensa del AO. PUEBLO-X (FICT.)', Tipo: 'Específica', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'Bat. Log.' },
          { Tarea: 'Desplegar el Batallón Logístico en el ASDI (FICT.)', Tipo: 'Implícita', 'De dónde sale': 'Doctrina', 'Quién la ejecuta': 'Bat. Log.' },
        ],
        hechos: { a: ['El EPA está transitable (FICT.)'], b: ['El CE mantiene el ARCE en su ubicación actual (FICT.)'] },
        decision: [
          { 'Curso de acción': 'CAP N° 1 — defensa en posición (FICT.)', Ventajas: 'Apoyo centralizado desde una sola área (FICT.).', Desventajas: 'EPA expuesto al flanco oeste (FICT.).', '¿Se puede apoyar?': 'Sí, con el ASDI adelante (FICT.).' },
          { 'Curso de acción': 'CAP N° 2 — defensa móvil (FICT.)', Ventajas: 'Menos bajas (FICT.).', Desventajas: 'Mayor consumo de Clase III (FICT.).', '¿Se puede apoyar?': 'Sí, con limitaciones de Clase III (FICT.).' },
        ],
      },
      g5: {},
    },
    ops: {
      limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog, sectoresLog: [],
      ejesLog: [
        { tipo: 'epa', coords: [[-68.3, -17.4], [-68.33, -16.97], [-68.33, -16.86]] },
        { tipo: 'epe', coords: [[-68.34, -16.86], [-68.31, -17.3]] },
      ],
      lineasEM: [], magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [],
      areaOps: { tipo: 'defensiva', modalidad: 'tenaz', ambiente: 'llano', coords: [[-68.6, -16.8], [-68.0, -16.8], [-68.0, -17.4], [-68.6, -17.4]], frente: [[-68.6, -16.8], [-68.0, -16.8]] },
      unidadConsiderada: { nombre: 'DIV.MEC.-1 (FICT.)', escalon: 'division', confirmada: true },
    },
  }
}

// Lo que contestaría una IA en cada hoja (el JSON del pedido).
function respuestaEval() {
  return {
    evaluacion: {
      t_cubiertas: { A: { estado: 'si', motivo: 'Monte bajo al sur de la estancia X (FICT.).' }, B: { estado: 'no', motivo: 'Pampa abierta (FICT.).' } },
      t_suelo: { A: { estado: 'si', motivo: 'Suelo firme y el río Y (FICT.) al este.' }, B: { estado: 'si', motivo: 'Pozos (FICT.).' } },
      s_distSeg: { A: { estado: 'no', motivo: 'La IA NO debe cambiar lo impositivo medido.' } },
    },
    conclusion: 'LAS ÁREAS A Y B TIENEN CONDICIONES DE REALIZAR EL APOYO LOGÍSTICO A LA MANIOBRA DE LA DIV.MEC.-1 (FICT.), MIENTRAS QUE EL ÁREA A TIENE LA VENTAJA EN RELACIÓN AL ÁREA B, CONSIDERANDO LOS ASPECTOS APOYO CERRADO Y CUBIERTAS Y ABRIGOS.',
    elegida: 'A',
  }
}
function respuestaASL() {
  return {
    objeto: 'Texto de la IA que NO debe pisar el objeto armado.',
    campos: {
      mejorCap: 'El CAP N° 1 — defensa en posición (FICT.) es el mejor apoyado: se apoya desde una sola área.',
      factores: '- Distancia del EPA (61 km) (FICT.).\n- Seguridad del flanco oeste (FICT.).',
      mision: 'Texto de la IA que NO debe pisar la misión de logística.',
    },
    caps: [{ nombre: 'CAP N° 1 — defensa en posición (FICT.)', analisis: { transportes: 'Disponibilidad de 40 camiones (FICT.); el EPA soporta 120 t/día (FICT.).' } }],
  }
}
function respuestaMatriz() {
  return {
    fases: [{ id: 'f1', desde: 'D-5 (0600)', hasta: 'D (0500)' }],
    celdas: {
      transporte: { f1: 'Prioridad de movimiento: Cl V hacia el RCB-2 (FICT.).\nPA: RCB-2 (FICT.).', f2: 'Ídem fase anterior' },
      amenaza: { f2: 'Nivel II: comandos enemigos sobre el EPA (FICT.).' },
      enfoque: { f1: 'Texto de la IA que NO debe pisar el enfoque del concepto.' },
    },
  }
}

module.exports = { ejercicioLogistica, respuestaEval, respuestaASL, respuestaMatriz, AREA_A, AREA_B, ARCE, cuadrado }
