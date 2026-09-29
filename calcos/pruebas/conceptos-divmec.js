// Ejercicio de PRUEBA para la hoja de conceptos entrelazados con la FORMA del caso que
// mandó el docente el 28-09 (orden general de operaciones de una División mecanizada
// en defensiva), con nombres FICTICIOS (alfabeto fonético; ninguna es una unidad real):
//   · la cadena de mando: CTO (XXXXX) → FF.TT.T.O. (XXXX) → I CE (XXX) → DIVMEC-1 (XX);
//   · la organización de la tarea de la orden como la lee la Mesa de un .docx (un
//     renglón por párrafo, el cuadro fila por fila): once unidades que dependen
//     directamente de la División y una BAJO CONTROL; sus subunidades no cuentan;
//   · las FT que armó el oficial en 🧩 Organización de la tarea (OD, OC1, OC2);
//   · otra división (DIVMEC-2) nombrada en «fuerzas amigas»: es ADYACENTE.
// `unidad` de la Orden queda VACÍA a propósito (como en el caso real): la unidad propia
// tiene que salir de la misión o del OBJETO de la orden aportada.

const ORGANIZACION = `ORGANIZACIÓN DE LA TAREA.
RCB-1
“ALFA”
RCB-2
“BRAVO”
RIM-8
“CHARLIE”
RIM-23 “DELTA”
Edrón. Tq. “A”
Edrón. Tq. “B”
Edrón. Tq. “C”
ERM. “D”
Edrón. C y S.
ERM. “A”
ERM. “B”
ERM. “C”
Edrón. C y S.
Comp. Inf. Mec. “A”
Comp. Inf. Mec. “B”
Comp. Inf. Mec. “C”
Comp. Inf. Ap. “D”
Comp. C y S.
Comp. Inf. Mec. “A”
Comp. Inf. Mec. “B”
Comp. Inf. Mec. “C”
Comp. Inf. Ap. “D”
Comp. C y S.
RIAT-30
“ECO”
RAM-2
“FOXTROT”
RAA-6
“GOLF”
BATING. MEC.- II
“HOTEL”
Comp. Inf. AT. “A”
Comp. Inf. AT. “B”
Comp. Inf. AT. “C”
Comp. Inf. AT. “D”
Comp. C y S.
Bat. Art. Mec. “A”
Bat. Art. Mec. “B”
Bat. Art. Mec. “C”
Bat. Cmdo.
Bat. C y S.
Bat. AA. “A”
Bat. AA. “B”
Bat. AA. “C”
Bat. Cmdo.
Bat. C y S.
Comp. Ing. Comb. “A”
Comp. Ing. Comb. “B”
Comp. Ing. Eq. Pes.
Comp. Ing. Puentes
Comp. Mtto. Ing.
Comp. C y S.
BAT. LOG. - I “INDIA”
BAT. COM. MEC. - I “JULIETT”
COMP. ICIA. - I “KILO”
BAJO CONTROL
Comp. Abtto.
Comp. Mtto.
Comp. Transp.
Comp. San.
Comp. C y S.
Comp. Telecom. “A”
Comp. Telecom. “B”
Comp. Telecom. “C”
Comp. Radares
Comp. C y S.
Secc. ICIA. Hum.
Secc. ICIA. Ae.
Secc. ICIA. Elect.
Secc. C y S.
Comp. Av. Ejto. “LIMA”`

// Las once unidades (y la de BAJO CONTROL) como tienen que salir en la hoja.
const PURAS = [
  ['RCB-1 «ALFA»', 'III', 'cabmec', 'maniobra'],
  ['RCB-2 «BRAVO»', 'III', 'cabmec', 'maniobra'],
  ['RIM-8 «CHARLIE»', 'III', 'mecanizada', 'maniobra'],
  ['RIM-23 «DELTA»', 'III', 'mecanizada', 'maniobra'],
  ['RIAT-30 «ECO»', 'III', 'antitanque', 'maniobra'],
  ['RAM-2 «FOXTROT»', 'III', 'artilleria', 'apoyo'],
  ['RAA-6 «GOLF»', 'III', 'antiaerea', 'apoyo'],
  ['BATING. MEC.-II «HOTEL»', 'II', 'ingenieria', 'apoyo'],
  ['BAT. COM. MEC.-I «JULIETT»', 'II', 'comunicaciones', 'apoyo'],
  ['COMP. ICIA.-I «KILO»', 'I', 'inteligencia', 'apoyo'],
  ['Comp. Av. Ejto. «LIMA»', 'I', 'aviacion', 'apoyo'],
  ['BAT. LOG.-I «INDIA»', 'II', 'logistica', 'spac'],
]

function ejercicioDivmec() {
  const u = (id, designacion, arma, escalon, lng, piezas = 4) => ({ id, bando: 'propias', tipo: 'unidad', designacion, arma, escalon, lat: -16.9, lng, piezas })
  const pz = (de, n, simbolo) => ({ id: `${de}-${n}`, de, simbolo })
  return {
    version: 1,
    nombre: 'PRUEBA DIVMEC (FICT.)',
    guardadoEn: '2026-09-28T12:00:00.000Z',
    pais: 'bolivia',
    unidades: [
      u('d-rcb1', 'RCB-1 «ALFA»', 'cabmec', 'regimiento', -68.2),
      u('d-rcb2', 'RCB-2 «BRAVO»', 'cabmec', 'regimiento', -68.5),
      u('d-rim8', 'RIM-8 «CHARLIE»', 'mecanizada', 'regimiento', -68.4),
      u('d-rim23', 'RIM-23 «DELTA»', 'mecanizada', 'regimiento', -68.3),
      u('d-riat30', 'RIAT-30 «ECO»', 'antitanque', 'regimiento', -68.35),
      u('d-ram2', 'RAM-2 «FOXTROT»', 'artilleria', 'regimiento', -68.3, 3),
      u('d-raa6', 'RAA-6 «GOLF»', 'antiaerea', 'regimiento', -68.3, 3),
      u('d-bating', 'BATING. MEC.-II «HOTEL»', 'ingenieria', 'batallon', -68.3),
      u('d-blog', 'BAT. LOG.-I «INDIA»', 'logistica', 'batallon', -68.3),
      u('d-bcom', 'BAT. COM. MEC.-I «JULIETT»', 'comunicaciones', 'batallon', -68.3),
      // Una subunidad puesta sola en el calco: con la organización de la orden NO es una
      // unidad que dependa directamente de la División.
      u('d-cia', 'Comp. Inf. Mec. «A» (RIM-8)', 'mecanizada', 'compania', -68.4, 3),
      { id: 'd-rojo', bando: 'enemigo', tipo: 'unidad', designacion: 'DIV. ACORAZADA ROJA (FICT.)', arma: 'blindada', escalon: 'division', lat: -16.6, lng: -68.3 },
    ],
    orgTarea: [
      { id: 'ft-aguila', nombre: 'FT ÁGUILA', escalon: 'batallon', operacion: 'od', tarea: 'atacar_fuego', proposito: 'DE BLOQUEAR LA PROGRESION DEL ENEMIGO', ft: true, clase: 'ft', piezas: [pz('d-rim8', 1, 'inf_mecanizada'), pz('d-rim8', 2, 'inf_mecanizada'), pz('d-rcb1', 1, 'cab_blindada'), pz('d-ram2', 1, 'artilleria')] },
      { id: 'ft-condor', nombre: 'FT CÓNDOR', escalon: 'batallon', operacion: 'oc1', tarea: 'apoyar_fuego', proposito: 'CON EL PROPOSITO DE DETENER EL AVANCE DE ROJO', ft: true, clase: 'ft', piezas: [pz('d-rim23', 1, 'inf_mecanizada'), pz('d-rim23', 2, 'inf_mecanizada'), pz('d-riat30', 1, 'antitanque')] },
      { id: 'ft-puma', nombre: 'FT PUMA', escalon: 'batallon', operacion: 'oc2', tarea: 'seguir_asumir', proposito: 'CONTINUAR CON EL DESGASTE', ft: true, clase: 'ft', piezas: [pz('d-rcb2', 1, 'cab_blindada'), pz('d-rcb2', 2, 'cab_blindada'), pz('d-rcb2', 3, 'cab_blindada'), pz('d-rcb2', 4, 'cab_blindada')] },
    ],
    fasesCOA: { propio: [{ nombre: 'PREPARACIÓN' }, { nombre: 'DEFENSA Y DESORGANIZACIÓN' }, { nombre: 'CANALIZACIÓN DE LA DIV. ACORAZADA' }, { nombre: 'DESTRUCCIÓN DE LA DIV. ACORAZADA' }], enemigo: [] },
    ordenSup: {
      escalonSuperior: 'I CUERPO DE EJÉRCITO',
      unidad: '',
      clasificacion: 'RESERVADO',
      mision: 'La DIVMEC-1 defiende y destruye a la DIVISIÓN ACORAZADA de ROJO a partir del día D (0500) al D+2 (1800) en su Área de Operaciones con el propósito de detener la progresión enemiga hacia la Zona del Interior.',
      propias:
        'Las FF.TT.T.O. defienden y neutralizan la ofensiva de los Cuerpos de Ejército I, II y III de ROJO a partir del D con el propósito de proteger zonas estratégicas y crear condiciones favorables para iniciar una contraofensiva. El I CE defiende y derrota al CE I de ROJO a partir del D (0500) hasta el D+15 (1700) con el propósito de frenar la progresión de ROJO hacia el interior. La DIVMEC-2 defiende en el sector ESTE con el propósito de fijar al segundo escalón de ROJO.',
      intencion: 'Propósito: crear condiciones para la contraofensiva.',
      organizacionTarea: ORGANIZACION,
    },
    documentos: [{ nombre: 'Orden General de Operaciones 01-35 (FICT.).docx', categoria: 'orden', texto: `ORDEN GENERAL DE OPERACIONES No. 01/35\nOBJETO : La DIVMEC-1 en la ejecución de Operaciones Defensivas.\nCARTAS : Especial (FICT.), Esc. 1:50.000.\n${ORGANIZACION}\n1. SITUACIÓN.\nFuerzas enemigas: la DIV. ACORAZADA de ROJO.` }],
    g3: {},
    ops: { limites: [], coordinacion: [], pasaje: [], tareas: [], zonasLog: [], sectoresLog: [], ejesLog: [], lineasEM: [], magnitudes: [], flechasZona: [], obstaculos: [], posDef: [], ains: [], objetivos: [], maniobra: [], areaOps: { tipo: 'defensiva', coords: [[-68.6, -16.8], [-68.1, -16.8], [-68.1, -17.0], [-68.6, -17.0]] } },
  }
}

// Lo que contestaría una IA que se EQUIVOCA como la del Word que mandó el docente:
// pone las FF.TT.T.O. como «TO» con XXX, el CE con XX, la División en la fila de
// maniobra junto a sus regimientos y a otra división (adyacente) entre las propias.
function respuestaIAEquivocada() {
  const F = (fase, tarea, proposito, esfuerzo = false) => ({ fase, tarea, proposito, esfuerzo })
  return {
    fases: [{ id: 'F1', nombre: 'PREPARACIÓN' }, { id: 'F2', nombre: 'DEFENSA Y DESORGANIZACIÓN' }, { id: 'F3', nombre: 'CANALIZACIÓN' }, { id: 'F4', nombre: 'DESTRUCCIÓN' }],
    unidades: [
      { id: 'n1', grupo: 'superior2', nombre: 'Fuerzas Terrestres del Teatro de Operaciones', magnitud: 'XXX', texto: 'TO', tarea: 'Defienden y neutralizan la ofensiva de los CE I, II y III de ROJO.', proposito: 'Proteger zonas estratégicas.' },
      { id: 'n2', grupo: 'superior1', nombre: 'Cuerpo de Ejército I', magnitud: 'XX', texto: 'CE', tarea: 'Defiende y derrota al CE I de ROJO.', proposito: 'Frenar la progresión de ROJO.' },
      { id: 'n3', grupo: 'maniobra', nombre: 'DIV.MEC.-1', magnitud: 'XX', arma: 'mecanizada', tarea: 'Defiende y destruye a la DIVISIÓN ACORAZADA de ROJO.', proposito: 'Detener la progresión enemiga.' },
      { id: 'n4', grupo: 'maniobra', nombre: 'DIVMEC-2', magnitud: 'XX', arma: 'mecanizada', tarea: 'Defiende en el sector ESTE.', proposito: 'Fijar al segundo escalón de ROJO.' },
      { id: 'n5', grupo: 'maniobra', nombre: 'RCB-1', magnitud: 'III', arma: 'cabmec', rol: 'OD', fases: [F('F1', 'Se desplaza por el ITIN. 4.', 'Constituirse en la reserva.'), F('F4', 'Ataca y destruye a las unidades de ROJO canalizadas en el AE.', 'Impedir su progresión.', true)] },
      { id: 'n6', grupo: 'maniobra', nombre: 'RIM-8', magnitud: 'III', arma: 'mecanizada', rol: 'OC1', fases: [F('F2', 'Ataca con fuego y desorganiza a las unidades enemigas.', 'Detener su avance.', true)] },
    ],
    relaciones: [{ desde: 'n5', hasta: 'n3', tipo: 'directa' }, { desde: 'n6', hasta: 'n5', tipo: 'directa' }],
  }
}

module.exports = { ejercicioDivmec, respuestaIAEquivocada, ORGANIZACION, PURAS }
if (require.main === module) process.stdout.write(JSON.stringify(ejercicioDivmec(), null, 2) + '\n')
