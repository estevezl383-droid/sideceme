// Ejercicio de PRUEBA para el G-1 (motor calcos/estado-mayor/v1, campos/g1.js), con
// unidades y lugares FICTICIOS. Una División en la ofensiva, en tres fases:
//   · fichas propias y enemigas, las fases del COA y la apreciación de bajas de las dos
//     primeras fases (panel «📊 Bajas»);
//   · la cadena de PP.GG. (PPGG y DPG), la ruta de PP.GG. y la Línea de Extraviados;
//     las instalaciones de ley y orden, el Área de Descanso a menos de 2 km del PRM (la
//     doctrina los quiere LEJOS) y el Puesto de Reunión de Reemplazos;
//   · la Orden del escalón superior (con tareas y limitaciones) y un documento aportado;
//   · hojas del G-1 ya trabajadas: tareas (F2·P3), suposiciones (F2·P6) y ventajas y
//     desventajas de cada CAP (F5·P1).
// También trae RESPUESTAS DE IA de ejemplo.
function ejercicioPersonal({ nombre = 'PRUEBA PERSONAL (FICT.)' } = {}) {
  const u = (id, designacion, arma, escalon, lat, lng, bando = 'propias') => ({ id, bando, tipo: 'unidad', designacion, arma, escalon, lat, lng, piezas: 3 })
  const inst = (id, instalacion, lat, lng) => ({ id, tipo: 'instalacion', instalacion, bando: 'propias', lat, lng })
  return {
    version: 1,
    nombre,
    guardadoEn: '2026-09-01T12:00:00.000Z',
    pais: 'bolivia',
    autorEM: 'My. PRUEBA (FICT.)',
    unidades: [
      u('p-alfa', 'RI-1 «ALFA» (FICT.)', 'infanteria', 'regimiento', -16.85, -68.4),
      u('p-bravo', 'RCB-2 «BRAVO» (FICT.)', 'blindada', 'regimiento', -16.86, -68.2),
      u('p-delta', 'RA-1 «DELTA» (FICT.)', 'artilleria', 'regimiento', -16.95, -68.28),
      u('e-rojo', 'BRIG. BL. ROJA (FICT.)', 'blindada', 'brigada', -16.7, -68.3, 'enemigas'),
      inst('i-ppgg', 'p_ppgg', -16.98, -68.31),
      inst('i-dpg', 'dpg', -17.2, -68.33),
      inst('i-pce', 'pce', -16.99, -68.25),
      inst('i-desc', 'a_descanso', -17.1, -68.3),
      inst('i-prm', 'prm', -17.108, -68.305),
      inst('i-prr', 'p_reu_reempl', -17.15, -68.29),
    ],
    orgTarea: [],
    fasesCOA: { propio: [{ nombre: 'RUPTURA (FICT.)' }, { nombre: 'EXPLOTACIÓN (FICT.)' }, { nombre: 'CONSOLIDACIÓN (FICT.)' }], enemigo: [] },
    bajasPorFase: [
      { efectivo: 6446, dias: 1, tipoOperacion: 'ofensiva', dispositivo: 'primer', terreno: 'desfavorable', enemigo: 'superior', clima: 'riguroso', sanidad: 'regular', moral: 'normal', experiencia: 'nueva', diasEnCombate: 1 },
      { efectivo: 6446, dias: 2, tipoOperacion: 'ofensiva', dispositivo: 'segundo', terreno: 'normal', enemigo: 'equivalente', clima: 'normal', sanidad: 'regular', moral: 'normal', experiencia: 'veterana', diasEnCombate: 2 },
    ],
    conceptoApoyo: [],
    misionLog: '',
    ordenSup: {
      escalonSuperior: 'I CUERPO DE EJÉRCITO (FICT.)',
      unidad: 'DIV.MEC.-1 (FICT.)',
      puestoMando: 'CG. PUEBLO-X',
      vigencia: 'D-15 (2300)',
      clave: 'xyz',
      numero: '3',
      clasificacion: 'RESERVADO',
      carta: 'Especial PUEBLO-X (FICT.), Esc. 1:250.000',
      mision: 'La DIV.MEC.-1 (FICT.) ataca a partir del D (0500) para conquistar el nudo vial de PUEBLO-Y (FICT.).',
      cuando: 'a partir del D (0500) hasta el D+3 (1800)',
      tareas: 'Evacuar los PP.GG. hasta el DPG del CE (FICT.)',
      limitaciones: 'No emplear mano de obra civil al norte del río Z (FICT.)',
    },
    documentos: [{ nombre: 'Anexo de Personal del CE (FICT.).pdf', categoria: 'orden', texto: 'ANEXO DE PERSONAL DEL I CE (FICT.). Los reemplazos llegarán al PRR de cada División el D+1 (FICT.). La Cía. PM. del CE recibe los PP.GG. en el DPG (FICT.).' }],
    g3: {},
    hojasG: {
      g1: {
        tareas: [{ Tarea: 'Mantener el efectivo de combate de los regimientos de primer escalón (FICT.)', Tipo: 'Esencial', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'G-1' }],
        hechos: { a: ['El CE asigna 300 reemplazos para el D+1 (FICT.)'], b: ['Los reemplazos del CE llegan antes del D+1 (FICT.)'] },
        decision: [
          { 'Curso de acción': 'CAP N° 1 — ataque por el norte (FICT.)', Ventajas: 'Un solo EPE para heridos y PP.GG. (FICT.).', Desventajas: 'Más bajas en la ruptura (FICT.).', '¿Se puede apoyar?': 'Sí, con reemplazos anticipados (FICT.).' },
          { 'Curso de acción': 'CAP N° 2 — envolvimiento por el oeste (FICT.)', Ventajas: 'Menos bajas (FICT.).', Desventajas: 'Dos rutas de evacuación (FICT.).', '¿Se puede apoyar?': 'Sí, con limitaciones en la custodia de PP.GG. (FICT.).' },
        ],
      },
      g4: {},
      g5: {},
    },
    ops: {
      limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [],
      ejesLog: [{ tipo: 'epe', coords: [[-68.34, -16.86], [-68.31, -17.3]] }],
      lineasEM: [
        { tipo: 'extraviados', coords: [[-68.45, -17.0], [-68.15, -17.0]] },
        { tipo: 'ppgg', coords: [[-68.31, -16.98], [-68.33, -17.2]] },
      ],
      magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [],
      areaOps: { tipo: 'ofensiva', modalidad: 'ataque', ambiente: 'llano', coords: [[-68.6, -16.8], [-68.0, -16.8], [-68.0, -17.4], [-68.6, -17.4]], frente: [[-68.6, -16.8], [-68.0, -16.8]] },
      unidadConsiderada: { nombre: 'DIV.MEC.-1 (FICT.)', escalon: 'division', confirmada: true },
    },
  }
}

// Lo que contestaría una IA (el JSON del pedido).
function respuestaAprec() {
  return {
    campos: {
      objeto: 'Texto de la IA que NO debe pisar el objeto armado.',
      mejorCap: 'El CAP N° 1 — ataque por el norte (FICT.) es el mejor apoyado: un solo EPE para heridos y PP.GG.',
      terrenoCCMM: 'El frío nocturno (FICT.) eleva las pérdidas fuera de combate en la ruptura.',
      mision: 'Texto de la IA que NO debe pisar la misión de personal.',
    },
    caps: [{ nombre: 'CAP N° 1 — ataque por el norte (FICT.)', fases: [{ valores: { administracion: 'Se prevén 120 PP.GG. (FICT.); custodia de la Cía. PM.' } }] }],
  }
}
function respuestaAnexo() {
  return { campos: { partes: 'Parte diario de efectivos a las 1800 (FICT.).', comunicaciones: 'IOC. N° 2 (FICT.).' } }
}
function respuestaTareas() {
  return [{ Tarea: 'Registrar las sepulturas de la fase de ruptura (FICT.)', Tipo: 'Implícita', 'De dónde sale': 'ECEM 15-08', 'Quién la ejecuta': 'Sección de Registro de Sepulturas' }]
}

module.exports = { ejercicioPersonal, respuestaAprec, respuestaAnexo, respuestaTareas }
