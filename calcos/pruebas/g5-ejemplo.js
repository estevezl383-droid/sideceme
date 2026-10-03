// Ejercicio de PRUEBA para el G-5 (motor calcos/estado-mayor/v3, campos/g5.js), con
// unidades, lugares y nombres FICTICIOS. Una División en la ofensiva, en tres fases:
//   · las CAPAS de centros poblados (dos con Censo 2024, dos por referencia de tipo) y de
//     infraestructura (hospital, escuelas, coliseo, policía, mercado, alcaldía, juzgado,
//     banco, terminal, hotel, radio, iglesia…), como las que carga la Mesa;
//   · la clasificación del G-5 (dos recursos NEGADOS) y la evacuación del panel (30 %,
//     3 días, 10 buses): faltan albergues;
//   · un eje humanitario que en su último tramo se MONTA sobre el EPA del G-4;
//   · las instalaciones de AC/GM (PC, PRE, CCE, LDS, ayuda humanitaria, bien protegido),
//     una de personal (G-1) y una de sanidad (G-4);
//   · la Orden del escalón superior (con tareas y limitaciones) y un documento aportado;
//   · hojas del G-5 ya trabajadas: tareas (F2·P3), hechos (F2·P6), temas (F2·P11) y
//     ventajas y desventajas de cada CAP (F5·P1); y la Apreciación de Personal del G-1.
// También trae RESPUESTAS DE IA de ejemplo (con textos que NO deben pisar lo escrito).
const punto = (lng, lat, props) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: props })
function capasAC() {
  const poi = (fclass, name, lng, lat) => punto(lng, lat, { fclass, name })
  return {
    poblaciones_puntos: {
      type: 'FeatureCollection',
      features: [
        { ...punto(-68.36, -16.92, { fclass: 'town', name: 'PUEBLO-X (FICT.)' }), _pob2024: 8000 },
        punto(-68.22, -17.02, { fclass: 'village', name: 'PUEBLO-Y (FICT.)', _censo: { pob2024: 3200 } }),
        punto(-68.33, -17.25, { fclass: 'village', name: 'PUEBLO-Z (FICT.)' }),
        punto(-68.4, -17.1, { fclass: 'hamlet', name: 'CASERÍO-W (FICT.)' }),
      ],
    },
    poblaciones_pois: {
      type: 'FeatureCollection',
      features: [
        poi('hospital', 'Hospital PUEBLO-X (FICT.)', -68.361, -16.921),
        poi('clinic', 'Posta de Salud PUEBLO-Y (FICT.)', -68.221, -17.021),
        poi('school', 'Unidad Educativa PUEBLO-X (FICT.)', -68.362, -16.922),
        poi('school', 'Colegio Nacional PUEBLO-Y (FICT.)', -68.222, -17.022),
        poi('stadium', 'Coliseo PUEBLO-Z (FICT.)', -68.331, -17.251),
        poi('police', 'Estación Policial PUEBLO-X (FICT.)', -68.363, -16.923),
        poi('fire_station', 'Bomberos PUEBLO-Y (FICT.)', -68.223, -17.023),
        poi('marketplace', 'Mercado Central PUEBLO-X (FICT.)', -68.364, -16.924),
        poi('fuel', 'Surtidor PUEBLO-Y (FICT.)', -68.224, -17.024),
        poi('water_tower', 'Tanque de agua PUEBLO-Z (FICT.)', -68.332, -17.252),
        poi('town_hall', 'Alcaldía PUEBLO-X (FICT.)', -68.365, -16.925),
        poi('courthouse', 'Juzgado PUEBLO-X (FICT.)', -68.366, -16.926),
        poi('bank', 'Banco PUEBLO-Y (FICT.)', -68.225, -17.025),
        poi('post_office', 'Correo PUEBLO-X (FICT.)', -68.367, -16.927),
        poi('terminal', 'Terminal de buses PUEBLO-X (FICT.)', -68.368, -16.928),
        poi('hotel', 'Hotel PUEBLO-Y (FICT.)', -68.226, -17.026),
        poi('tower', 'Radio PUEBLO-X (FICT.)', -68.369, -16.929),
        poi('christian_catholic', 'Iglesia San Juan (FICT.)', -68.37, -16.93),
        poi('bench', 'Banco de plaza (FICT.)', -68.371, -16.931),
      ],
    },
  }
}
function ejercicioAC({ nombre = 'PRUEBA AC/GM (FICT.)' } = {}) {
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
      u('e-rojo', 'BRIG. BL. ROJA (FICT.)', 'blindada', 'brigada', -16.7, -68.3, 'enemigas'),
      inst('i-pcac', 'pc_acgm', -17.0, -68.35),
      inst('i-pre', 'p_evac_civ', -16.93, -68.36),
      inst('i-cce', 'c_ctrl_evac', -17.05, -68.36),
      inst('i-lds', 'destino_seguro', -17.25, -68.33),
      inst('i-ayuda', 'p_ayuda', -17.02, -68.22),
      inst('i-prot', 'bien_protegido', -17.15, -68.45),
      inst('i-ppgg', 'p_ppgg', -16.98, -68.31),
      inst('i-pced', 'pced', -17.1, -68.28),
    ],
    orgTarea: [],
    fasesCOA: { propio: [{ nombre: 'RUPTURA (FICT.)' }, { nombre: 'EXPLOTACIÓN (FICT.)' }, { nombre: 'CONSOLIDACIÓN (FICT.)' }], enemigo: [] },
    bajasPorFase: [],
    conceptoApoyo: [{ prioridad: 'RI-1 (FICT.)' }],
    misionLog: 'Apoyar con los servicios a la DIV.MEC.-1 (FICT.) en el ataque.',
    estadosRecursos: { 'albergue:0': 'explotable', 'abastecimiento:1': 'negado', 'transporte:1': 'negado' },
    evacuacion: { pctEvacuar: 30, dias: 3, buses: 10 },
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
      intencion: 'Conquistar PUEBLO-Y (FICT.) sin daños a la población (FICT.).',
      cuando: 'a partir del D (0500) hasta el D+3 (1800)',
      tareas: 'Evacuar la población civil de PUEBLO-X (FICT.) hasta el D-1',
      limitaciones: 'No emplear mano de obra civil al norte del río Z (FICT.); No batir la represa de PUEBLO-W (FICT.)',
    },
    documentos: [{ nombre: 'Anexo de AC-GM del CE (FICT.).pdf', categoria: 'orden', texto: 'ANEXO DE AC/GM DEL I CE (FICT.). Los Locales de Destino Seguro del CE están en PUEBLO-Z (FICT.). La Cruz Roja (FICT.) opera en PUEBLO-Y (FICT.).' }],
    g3: {},
    hojasG: {
      g1: { aprecActiva: { esquema: 'aprec-personal-v1', campos: { civil: 'Se emplea mano de obra civil sólo al sur del río Z (FICT.).' } } },
      g4: {},
      g5: {
        tareas: [{ Tarea: 'Mantener el orden público en PUEBLO-X durante la ruptura (FICT.)', Tipo: 'Esencial', 'De dónde sale': 'Orden N° 3', 'Quién la ejecuta': 'G-5' }],
        hechos: { a: ['La alcaldía de PUEBLO-X coopera con la DIV (FICT.)'], b: ['La población no interfiere con el ataque nocturno (FICT.)'] },
        temas: [{ 'Tema o mensaje': 'No circular por la ruta 1 durante el ataque (FICT.)', 'A quién va dirigido': 'Población de PUEBLO-X', 'Por qué medio': 'Radio PUEBLO-X', Cuándo: 'D-1' }],
        decision: [
          { 'Curso de acción': 'CAP N° 1 — ataque por el norte (FICT.)', Ventajas: 'Un solo eje humanitario (FICT.).', Desventajas: 'Atraviesa PUEBLO-X (FICT.).', '¿Se puede apoyar?': 'Sí, evacuando el D-1 (FICT.).' },
          { 'Curso de acción': 'CAP N° 2 — envolvimiento por el oeste (FICT.)', Ventajas: 'No toca PUEBLO-X (FICT.).', Desventajas: 'Dos LDS (FICT.).', '¿Se puede apoyar?': 'Sí, con dos Locales de Destino Seguro (FICT.).' },
        ],
      },
    },
    ops: {
      limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [],
      ejesLog: [{ tipo: 'epa', coords: [[-68.3, -16.85], [-68.3, -17.3]] }, { tipo: 'epe', coords: [[-68.26, -16.86], [-68.26, -17.3]] }],
      lineasEM: [{ tipo: 'humanitario', coords: [[-68.36, -16.93], [-68.36, -17.05], [-68.3, -17.1], [-68.3, -17.2]] }],
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
      mision: 'Texto de la IA que NO debe pisar la misión de AC/GM.',
      mejorCap: 'El CAP N° 1 — ataque por el norte (FICT.) es el mejor apoyado: un solo eje humanitario.',
      terrenoEfectosEnemigo: 'El enemigo puede usar PUEBLO-X (FICT.) como punto fuerte entre la población.',
      saludPublica: 'Necesidad: atención de 3780 evacuados (FICT.); disponibilidad: Hospital PUEBLO-X (PROTEGIDO).',
    },
    caps: [{ nombre: 'CAP N° 2 — envolvimiento por el oeste (FICT.)', ventajas: 'Texto de la IA que NO debe pisar las ventajas del CAP N° 2.', desventajas: 'Texto de la IA que NO debe pisar.' }, { nombre: 'CAP N° 3 — fijación y desborde (FICT.)', ventajas: 'Evita PUEBLO-Y (FICT.).', desventajas: 'Tres fases de evacuación (FICT.).' }],
  }
}
function respuestaAnexo() {
  return { campos: { toqueQueda: 'Toque de queda en PUEBLO-X de 2000 a 0600 desde el D-1 (FICT.).', comunicaciones: 'IOC. N° 2 (FICT.).' } }
}
function respuestaTareas() {
  return [{ Tarea: 'Habilitar el segundo Local de Destino Seguro en PUEBLO-Z (FICT.)', Tipo: 'Implícita', 'De dónde sale': 'Previsión de evacuación', 'Quién la ejecuta': 'Sección de AC' }]
}
// El ANEXO escrito como documento (la IA no contestó en JSON): «B.- Fuerzas propias.» tiene
// texto propio Y subapartados.
const PROSA_ANEXO = `## ANEXO (ASUNTOS CIVILES Y GOBIERNO MILITAR)

**Organización de la Tarea.** Sección de AC de la DIV (FICT.) con cuatro equipos funcionales.

### I.- SITUACIÓN.
**A.- Fuerzas enemigas.** Referirse al Anexo de Inteligencia.
**B.- Fuerzas propias.** La población del área es de 12.600 habitantes (FICT.).
**1.- Actitud de la población.** Coopera con la DIV (FICT.).
**2.- Autoridades y agencias presentes.** Alcaldía de PUEBLO-X y Cruz Roja (FICT.).
**3.- Recursos del área.** 18 recursos identificados (FICT.).
**C.- Hipótesis.** La población no interfiere (FICT.).

### II.- MISIÓN.
El G-5 de la DIV.MEC.-1 conduce la evacuación de 3780 personas (FICT.).

### III.- EJECUCIÓN.
**A.- Concepto de Apoyo.** Prioridad de esfuerzo a Servicios Especiales en la fase I (FICT.).
**1.- Previsión de evacuación y dimensionamiento del apoyo.** 3780 personas (FICT.).
**2.- Ejes humanitarios.** Eje 1 por la ruta 4 (FICT.).
**3.- Instalaciones de AC/GM.** LDS en el Coliseo PUEBLO-Z (FICT.).
**B.- Tareas para los Equipos Funcionales.**
1. **En la función de Gobierno.** Enlace con la alcaldía (FICT.).
**C.- Instrucciones de Coordinación.**
**3.- Toque de queda.** De 2000 a 0600 (FICT.).

### IV.- APOYO DE SERVICIO.
Referirse al Anexo de Apoyo de Servicio de Combate (FICT.).

### V.- COMANDO Y COMUNICACIONES.
**A.- Comando.** PC en PUEBLO-X (FICT.).
**B.- Comunicaciones.** IOC. N° 2 (FICT.).
`

module.exports = { capasAC, ejercicioAC, respuestaAprec, respuestaAnexo, respuestaTareas, PROSA_ANEXO }
