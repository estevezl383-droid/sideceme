// Ejercicio de PRUEBA para la hoja de conceptos entrelazados, con unidades FICTICIAS
// (ninguna es una unidad real). Imita la forma de un ejercicio de División: la orden
// del escalón superior cargada, regimientos de maniobra en el calco, apoyo de combate,
// SPAC, una organización de la tarea con OD / OC y las fases del COA propio.
// También trae una RESPUESTA DE IA de ejemplo, para probar el «Aplicar».
function ejercicioConceptos() {
  const u = (id, designacion, arma, escalon, lng, piezas = 3) => ({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat: -16.9, lng, piezas })
  return {
    version: 1,
    nombre: 'PRUEBA CONCEPTOS (FICT.)',
    guardadoEn: '2026-09-01T12:00:00.000Z',
    pais: 'bolivia',
    unidades: [
      u('f-alfa', 'RIM-1 «ALFA» (FICT.)', 'mecanizada', 'regimiento', -68.4),
      u('f-bravo', 'RCM-2 «BRAVO» (FICT.)', 'cabmec', 'regimiento', -68.3),
      u('f-charlie', 'RIM-3 «CHARLIE» (FICT.)', 'mecanizada', 'regimiento', -68.2),
      u('f-delta', 'RA-1 «DELTA» (FICT.)', 'artilleria', 'regimiento', -68.3),
      u('f-eco', 'B.ING.-1 «ECO» (FICT.)', 'ingenieria', 'batallon', -68.3),
      u('f-fox', 'B.LOG.-1 «FOX» (FICT.)', 'logistica', 'batallon', -68.35),
      { id: 'f-rojo', bando: 'enemigo', tipo: 'unidad', designacion: 'BRIG. BL. ROJA (FICT.)', arma: 'blindada', escalon: 'brigada', lat: -16.7, lng: -68.3 },
    ],
    orgTarea: [
      { id: 'ag-od', nombre: 'GOLF', escalon: 'regimiento', operacion: 'od', tarea: 'destruir', proposito: 'evitar que la brigada enemiga (FICT.) alcance el nudo vial de la localidad X', ft: true, clase: 'ft', piezas: [{ id: 'f-charlie-1', de: 'f-charlie', simbolo: 'inf_mecanizada' }] },
    ],
    fasesCOA: { propio: [{ nombre: 'OCUPACIÓN DE LA POSICIÓN (FICT.)' }, { nombre: 'DEFENSA (FICT.)' }, { nombre: 'CONTRAATAQUE (FICT.)' }], enemigo: [] },
    ordenSup: {
      escalonSuperior: 'I CUERPO DE EJÉRCITO (FICT.)',
      unidad: 'DIV.MEC.-1 (FICT.)',
      clasificacion: 'RESERVADO',
      mision: 'La DIV.MEC.-1 (FICT.) defiende el sector asignado entre el D (0500) y el D+2 (1800) con el propósito de destruir a la brigada blindada enemiga (FICT.) en el área de empeño AZUL.',
      propias: 'El I CE (FICT.) defiende en el sector norte con el propósito de proteger la capital (FICT.). La DIV-2 (FICT.) defiende al este.',
      intencion: 'Propósito: crear condiciones para la contraofensiva.',
    },
    documentos: [{ nombre: 'Orden de operaciones (FICT.).pdf', categoria: 'orden', texto: 'ORDEN DE OPERACIONES N° 1 (FICT.). El I CE defiende en el sector norte. La DIV.MEC.-1 (FICT.) defiende el sector asignado.' }],
    g3: {
      // Formato narrativo de antes: tiene que seguir guardado y pasarse a la IA.
      entrelazados: { 'MISIONES DE LAS UNIDADES ADYACENTES': 'ANTECEDENTE SIN ALTERAR (FICT.)' },
    },
    ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [], areaOps: { tipo: 'defensiva', coords: [[-68.5, -16.8], [-68.1, -16.8], [-68.1, -17.0], [-68.5, -17.0]] } },
  }
}

// Lo que contestaría una IA (unidades nombradas, sin ids: la Mesa las reconoce por el nombre).
function respuestaIA() {
  const F = (fase, tarea, proposito, esfuerzo = false) => ({ fase, tarea, proposito, esfuerzo })
  return {
    fases: [{ id: 'F1', nombre: 'OCUPACIÓN DE LA POSICIÓN (FICT.)' }, { id: 'F2', nombre: 'DEFENSA (FICT.)' }, { id: 'F3', nombre: 'CONTRAATAQUE (FICT.)' }],
    unidades: [
      { grupo: 'superior2', nombre: 'I CUERPO DE EJÉRCITO (FICT.)', magnitud: 'XXX', texto: 'CE', tarea: 'Defiende en el sector norte (FICT.).', proposito: 'Proteger la capital (FICT.) y crear condiciones para la contraofensiva.' },
      { grupo: 'superior1', propia: true, nombre: 'DIV.MEC.-1 (FICT.)', magnitud: 'XX', arma: 'mecanizada', tarea: 'Defiende el sector asignado entre el D (0500) y el D+2 (1800).', proposito: 'Destruir a la brigada blindada enemiga (FICT.) en el AE AZUL.' },
      { grupo: 'maniobra', nombre: 'RIM-1 «ALFA» (FICT.)', rol: 'OC1', fases: [F('F1', 'Ocupa posiciones en el sector oeste (FICT.).', 'Estar en condiciones de defender en la fase II.'), F('F2', 'Defiende y canaliza a la brigada enemiga hacia el AE AZUL.', 'Atraer al enemigo al AE AZUL.', true)] },
      { grupo: 'maniobra', nombre: 'RCM-2 «BRAVO» (FICT.)', rol: 'OC2', fases: [F('F1', 'Retarda y ataca con fuego a la vanguardia enemiga.', 'Ganar tiempo para la ocupación de la posición.', true), F('F2', 'Defiende y bloquea al este (FICT.).', 'Impedir que el enemigo eluda el AE AZUL.')] },
      { grupo: 'maniobra', nombre: 'FT «GOLF»', rol: 'OD', fases: [F('F1', 'Ocupa la zona de reunión (FICT.).', 'Preservar su poder de combate.'), F('F3', 'Contraataca y destruye a la brigada enemiga en el AE AZUL.', 'Impedir que alcance el nudo vial (FICT.).', true)] },
      { grupo: 'apoyo', nombre: 'RA-1 «DELTA» (FICT.)', magnitud: 'III', arma: 'artilleria', fases: [{ fase: 'F2', tarea: 'Neutralizar a la brigada enemiga.', proposito: 'Evitar su despliegue ordenado.', paf: 'OC1', efecto: 'Ocasionar el 30 % de daños (FICT.).' }] },
      { grupo: 'apoyo', nombre: 'B.ING.-1 «ECO» (FICT.)', fases: [{ fase: 'F1', pe: 'Contramovilidad mediante fajas de minas.', pt: 'OC1 y OC2.' }] },
      { grupo: 'apoyo', nombre: 'CIA. COM.-1 (FICT.)', magnitud: 'I', arma: 'comunicaciones', tarea: 'Enlaza al PC con las unidades de maniobra.', proposito: 'Asegurar el mando y control.', prioridad: 'OD.' },
      { grupo: 'spac', nombre: 'B.LOG.-1 «FOX» (FICT.)', tarea: 'Abastece y evacúa.', proposito: 'Sostener la defensa.', prioridad: 'OD, OC1, OC2.' },
    ],
    relaciones: [{ desde: 'CIA. COM.-1 (FICT.)', hasta: 'FT «GOLF»', tipo: 'directa' }],
  }
}

module.exports = { ejercicioConceptos, respuestaIA }
if (require.main === module) process.stdout.write(JSON.stringify(ejercicioConceptos(), null, 2) + '\n')
