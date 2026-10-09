// Ejercicio de PRUEBA para el Comandante y el JEM (motor calcos/estado-mayor/v6, campos/cmte.js
// y campos/jem.js), con unidades y nombres FICTICIOS. Parte del ejercicio del G-5 y le suma lo
// que ya hizo el Estado Mayor ANTES de que el Comandante y el JEM trabajen sus hojas:
//   · la Línea Inicial de Tiempo del JEM (día D, TD/TE/TTD) en el tablero del G-3;
//   · del G-2, la CAE más probable y la más peligrosa y los vacíos de inteligencia (PICB);
//   · del G-3, la misión reexpresada, tareas, limitaciones, concepto, el CAP, los eventos
//     críticos, el método del juego de guerra y los RCIC.;
//   · de G-1, G-4, G-5 y EME., RCIC. y ventajas y desventajas de cada CAP, y la apreciación
//     actualizada del G-1;
//   · del Comandante y del JEM, hojas ya empezadas (para comprobar que NO se pisan).
const { ejercicioAC } = require('./g5-ejemplo.js')

const LINEA = { recepcion: 'D-15 (2300)', inicioOperacion: 'D (0500)', finOperaciones: 'D+2 (1800)', modo: 'diaD' }

function ejercicioMando(op = {}) {
  const d = ejercicioAC(op)
  d.picb = {
    ht4: { a: ['Ubicación de la reserva blindada enemiga (FICT.)', 'Estado del puente de PUEBLO-Y (FICT.)'], b: ['El enemigo no refuerza antes del D (FICT.)'] },
    ht18: { _marca: { 'CAE-1': 'MÁS PROBABLE', 'CAE-2': 'MÁS PELIGROSO' } },
    cae: { Misión: 'Defender PUEBLO-Y (FICT.) y contraatacar con la reserva.', 'Estado final deseado': 'PUEBLO-Y (FICT.) en manos enemigas y la DIV fijada al sur.' },
  }
  d.g3 = {
    lineaTiempo: { ...LINEA },
    rcic: [
      { 'N°': '1', 'Tipo (RCIC / EEIA)': 'RCIC', Requerimiento: '¿Dónde está la reserva blindada enemiga? (FICT.)', '¿Qué decisión sostiene?': 'Empleo de la reserva', 'Plazo (no después de)': 'D-3' },
      { 'N°': '2', 'Tipo (RCIC / EEIA)': 'EEIA', Requerimiento: 'Estado del puente de PUEBLO-Y (FICT.)', '¿Qué decisión sostiene?': 'Eje principal', 'Plazo (no después de)': 'D-2' },
    ],
    tareas: [
      { 'N° (orden cronológico)': '1', 'Tarea ESPECÍFICA (impuesta por el escalón superior)': 'Conquistar el nudo vial de PUEBLO-Y (FICT.)', 'Tarea IMPLÍCITA (necesaria para poder ejecutarla)': 'Forzar el paso del río Z (FICT.)', '¿ESENCIAL?': 'Sí' },
    ],
    limitaciones: { a: ['No batir la represa de PUEBLO-W (FICT.)', 'No cruzar al norte del río Z antes del D (FICT.)'], b: ['Mantener abierta la ruta 1 (FICT.)'] },
    mision: {
      'QUÉ (tipo de operación + tarea esencial, como tarea táctica)': 'Atacar y conquistar el nudo vial de PUEBLO-Y (FICT.)',
      'PROPÓSITO (el porqué de la operación)': 'Permitir al I CE (FICT.) proseguir el ataque hacia el norte.',
      'ENUNCIADO COMPLETO DE LA MISIÓN': 'La DIV.MEC.-1 (FICT.) ataca a partir del D (0500) para conquistar PUEBLO-Y (FICT.) con el propósito de permitir al I CE proseguir el ataque.',
    },
    concepto: {
      'Forma de maniobra elegida y por qué': 'Penetración por el norte para evitar el río Z (FICT.).',
      'Estado final deseado': 'PUEBLO-Y (FICT.) conquistado, enemigo destruido y la ruta 1 abierta.',
    },
    coa: { 'Denominación del CAP': 'CAP N° 3 — fijación y desborde (FICT.)' },
    eventos: [{ 'N° P.D.': '1', 'Evento crítico': 'Cruce del río Z (FICT.)', 'No antes de': 'D (0600)', 'No después de': 'D (0800)' }],
    metodo: {
      'Técnica elegida (faja · profundidad · caja)': 'FAJA',
      'Por qué esa técnica': 'Tres ejes paralelos (FICT.).',
      'Método de registro elegido': 'Matriz de sincronización con la Plantilla sustentadora de la decisión (FICT.).',
      'Orden de precedencia de los SOCB en el turno': 'Inteligencia, maniobra, fuegos (FICT.).',
    },
  }
  const rc = (req, quien) => ({ Requerimiento: req, 'Por qué es crítico': 'Sostiene la evacuación (FICT.)', 'Quién lo busca': quien, 'Para cuándo': 'D-2' })
  d.hojasG.g1 = {
    ...d.hojasG.g1,
    rcic: [rc('Cuántos prisioneros esperar en la fase I (FICT.)', 'G-2')],
    aprecOrientacion: { esquema: 'aprec-personal-v1', numero: '', campos: { mision: 'Misión de personal (FICT.).' }, caps: [], ideas: '', firma: '', iaCampos: [] },
    decision: [{ 'Curso de acción': 'CAP N° 3 — fijación y desborde (FICT.)', Ventajas: 'Menos bajas (FICT.).', Desventajas: 'Más reemplazos (FICT.).', '¿Se puede apoyar?': 'Sí' }],
  }
  d.hojasG.g4 = { rcic: [rc('Capacidad del puente de PUEBLO-Y para cargas pesadas (FICT.)', 'G-4')] }
  d.hojasG.g5 = { ...d.hojasG.g5, rcic: [rc('Cuántos civiles quedan en PUEBLO-X el D-1 (FICT.)', 'G-5')], aprecOrientacion: { esquema: 'aprec-acgm-v1', numero: '', campos: { mision: 'Misión de AC/GM (FICT.).' }, caps: [], ideas: '', firma: '', iaCampos: [] } }
  d.hojasG.eme = {}
  // Lo que ya empezaron el Comandante y el JEM (NO se debe pisar)
  d.hojasG.cmte = {
    intencion: { 'Propósito ampliado': 'Propósito escrito por el Comandante (FICT.).' },
    seleccionCoa: [{ 'Curso de acción': 'CAP N° 1 — ataque por el norte (FICT.)', '¿Pasa al Juego de Guerra?': 'Sí', 'Modificación que ordena el Cmte.': 'Sumar una reserva (FICT.)' }],
  }
  d.hojasG.jem = {
    rolExposiciones: [{ Expositor: 'G-3 · Operaciones', 'Qué expone': 'CAP N° 1 y CAP N° 2 (FICT.)', Tiempo: '15 min', 'Recomendación que sostiene': 'CAP N° 1 — ataque por el norte (FICT.)' }],
  }
  return d
}
module.exports = { ejercicioMando, LINEA }
