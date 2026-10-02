// Ejercicio de PRUEBA para la matriz de administración del riesgo (F2·P7 / F6·P3), con
// unidades y lugares FICTICIOS. Imita un ejercicio de División en la defensa:
//   · la Orden del escalón superior con el membrete (escalón superior, unidad, puesto de
//     mando, hora, clave del redactor) y clasificación RESERVADO (la matriz sale SECRETO);
//   · la Línea Inicial de Tiempo, las tareas de la F2·P3 y la reexpresión de la misión;
//   · la F2·P7 guardada con el formato de ANTES (renglones con «[IA — verificar]»),
//     como la del Word que mandó el docente.
// También trae una RESPUESTA DE IA de ejemplo (el JSON de la matriz), para el «Aplicar».
function ejercicioRiesgo() {
  const u = (id, designacion, arma, escalon, lng) => ({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat: -16.9, lng, piezas: 3 })
  return {
    version: 1,
    nombre: 'PRUEBA RIESGO (FICT.)',
    guardadoEn: '2026-09-01T12:00:00.000Z',
    pais: 'bolivia',
    autorEM: 'My. PRUEBA (FICT.)',
    unidades: [
      u('r-alfa', 'RIM-1 «ALFA» (FICT.)', 'mecanizada', 'regimiento', -68.4),
      u('r-bravo', 'RCB-2 «BRAVO» (FICT.)', 'blindada', 'regimiento', -68.3),
      u('r-delta', 'RA-1 «DELTA» (FICT.)', 'artilleria', 'regimiento', -68.3),
      { id: 'r-rojo', bando: 'enemigo', tipo: 'unidad', designacion: 'BRIG. BL. ROJA (FICT.)', arma: 'blindada', escalon: 'brigada', lat: -16.7, lng: -68.3 },
    ],
    orgTarea: [],
    fasesCOA: { propio: [{ nombre: 'OCUPACIÓN (FICT.)' }, { nombre: 'DEFENSA (FICT.)' }], enemigo: [] },
    ordenSup: {
      escalonSuperior: 'I CUERPO DE EJÉRCITO (FICT.)',
      unidad: 'DIV.MEC.-1 (FICT.)',
      puestoMando: 'CG. PUEBLO-X',
      vigencia: 'D-15 (2300)',
      clave: 'xyz',
      numero: '3',
      clasificacion: 'RESERVADO',
      mision: 'La DIV.MEC.-1 (FICT.) defiende y fija a las fuerzas enemigas a partir del D (0500) hasta el D+1 (1800) en el AO. PUEBLO-X (FICT.).',
    },
    documentos: [{ nombre: 'Orden de operaciones (FICT.).pdf', categoria: 'orden', texto: 'ORDEN DE OPERACIONES N° 3 (FICT.). La DIV.MEC.-1 (FICT.) defiende el AO. PUEBLO-X. Neblina de 04:30 a 07:30 h.' }],
    g3: {
      lineaTiempo: { recepcion: 'D-7 (0800)', inicioOperacion: 'D (0500)', finOperaciones: 'D+1 (1800)' },
      tareas: [
        { 'N° (orden cronológico)': '1', 'Tarea ESPECÍFICA (impuesta por el escalón superior)': 'Defender el AO. PUEBLO-X (FICT.)', 'Tarea IMPLÍCITA (necesaria para poder ejecutarla)': 'Ocupar y organizar la posición defensiva', '¿ESENCIAL?': 'Sí' },
        { 'N° (orden cronológico)': '2', 'Tarea ESPECÍFICA (impuesta por el escalón superior)': 'Fijar a la brigada enemiga (FICT.)', 'Tarea IMPLÍCITA (necesaria para poder ejecutarla)': 'Evacuar a la población civil del AO', '¿ESENCIAL?': '' },
      ],
      // La hoja como la guardaba la versión anterior (una lista de renglones).
      riesgo: [
        {
          'Peligro identificado': 'Ataque profundo de artillería de 155 mm (FICT.) sobre las posiciones de la LPR. [IA — verificar]',
          Probabilidad: 'Alta [IA — verificar]',
          Severidad: 'Alta [IA — verificar]',
          'Nivel de riesgo inicial': 'Alto [IA — verificar]',
          'Medida de control': 'Ejecutar obras de fortificación y enmascaramiento. [IA — verificar]',
          'Quién la ejecuta': 'Comandantes del RIM-1 (FICT.) [IA — verificar]',
          'Riesgo residual': 'Medio [IA — verificar]',
        },
      ],
    },
    ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [], unidadConsiderada: { nombre: 'DIV.MEC.-1 (FICT.)', escalon: 'division', confirmada: true }, areaOps: { tipo: 'defensiva', coords: [[-68.5, -16.8], [-68.1, -16.8], [-68.1, -17.0], [-68.5, -17.0]] } },
  }
}

// Lo que contestaría una IA: la matriz en el JSON del pedido (tareas nuevas y la de la
// hoja anterior, identificada por su id, con su estimación en letras).
function respuestaIA() {
  const P = (peligro, factor, probabilidad, severidad, controles, probabilidadResidual, severidadResidual, implementar, fuente, id) => ({ ...(id ? { id } : {}), peligro, factor, probabilidad, severidad, controles, probabilidadResidual, severidadResidual, implementar, fuente })
  return {
    preparacion: 'D-6 (0900)',
    tareas: [
      {
        id: 't-antes',
        tarea: 'Ocupar y organizar la posición defensiva',
        peligros: [P('', '', 'B', 'II', [], 'D', 'II', ['Anexo de Operaciones (FICT.): plan de fortificación por fases.'], '§1 Orden del escalón superior (FICT.)', 't-antes-p1')],
      },
      {
        tarea: 'Reconocimientos en el terreno (FICT.)',
        peligros: [
          P('Accidentes por neblina de 04:30 a 07:30 h durante los reconocimientos en el AO. PUEBLO-X (FICT.)', 'meteorologia', 'B', 'III', ['El Cmte. de cada patrulla (FICT.) no mueve vehículos con visibilidad menor a 200 m; guías del lugar.'], 'D', 'III', ['PON de reconocimiento (FICT.)', 'Instrucción antes del D-5 (FICT.)'], '§4 del expediente — neblina (FICT.)'),
          P('Fuego enemigo sobre las patrullas en el frente (FICT.)', 'enemigo', 'C', 'II', ['Patrullas con apoyo de fuego planificado del RA-1 (FICT.).'], 'D', 'II', ['Anexo de Apoyo de Fuegos (FICT.)'], '§10 PICB (FICT.)'),
        ],
      },
      {
        tarea: 'Evacuar a la población civil del AO',
        peligros: [P('Civiles en los ejes de movimiento del RCB-2 (FICT.)', 'civiles', 'B', 'III', ['El G-5 (FICT.) evacúa hasta el D-2 por el eje secundario.'], 'D', 'IV', ['Anexo de Asuntos Civiles (FICT.)'], '§12 (FICT.)')],
      },
    ],
  }
}

module.exports = { ejercicioRiesgo, respuestaIA }
if (require.main === module) process.stdout.write(JSON.stringify(ejercicioRiesgo(), null, 2) + '\n')
