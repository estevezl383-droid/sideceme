// Reemplazos del 2026-10-27 sobre calcos/assets/index-op3-20261026.js → index-guia-plan-20261027.js.
// Sergio, con el Word de la F2·P15 «Guía de Planificación del Comandante» del CE-I y el formato de la Escuela al lado:
// «el formato está muy mal». La hoja era un cuadro «Área / Sección · Guía impartida · Observación» y el Word salía con
// un «A.- Área / Sección: … · Guía impartida: … · Observación: …» por renglón. El formato del PMTD 2017 (Parte
// Tercera, Cap. II) son los párrafos I.- LA OPERACIÓN DECISIVA … XIII.- PRIORIDADES DE APOYO DE SERVICIO DE COMBATE;
// la Guía de Planificación Final (F6·P2), del mismo formato, I.- DECISIÓN … VI.- ENSAYOS. Las dos hojas y la lectura
// de lo escrito con el cuadro viejo están en guia-planificacion/v1/guia.mjs; acá:
//   · el import;
//   · las dos hojas del Comandante (PLe) son las del módulo (campos con su ayuda);
//   · lo guardado con el cuadro viejo se lee con el formato nuevo: en la hoja (yU), en el Word (Jq) y en la IA (KD);
//   · el pedido a la IA dice qué va en cada párrafo (ayudaIA).
//
// SHA-256 de index-op3-20261026.js (antes de estos reemplazos): 4ebbd3ab59a83a5dbb023a585a14262f2d53ea7a045bd5eb6c04dd143e70dc90
module.exports = [
  {
    nombre: 'El import de la Guía de Planificación',
    viejo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025b";',
    nuevo: 'import SIDEvPanel from "../evento-critico/v1/panel.js?v=ev20261025b";import {HOJA_GUIA_PLANIFICACION as SIDGuiaPlan,HOJA_GUIA_FINAL as SIDGuiaFinal,leerGuia as SIDGuiaLeer} from "../guia-planificacion/v1/guia.mjs?v=guia20261027";',
    veces: 1,
  },
  {
    nombre: 'F2·P15 del Comandante: los trece párrafos del PMTD 2017',
    viejo: '{id:"guiaPlanificacion",num:"F2·P15",nom:"Guía de Planificación del Comandante",tipo:"filas",entrega:"SE DIFUNDE SÓLO AL ESTADO MAYOR",cols:["Área / Sección","Guía impartida","Observación"],nota:"DISTINTA de la Guía Inicial: ésta sale DESPUÉS del análisis de la misión y con ella el Estado Mayor recién puede desarrollar los cursos de acción. Para la Sección II el cuadro precisa qué debe cubrir: inteligencia, contrainteligencia, vacíos de inteligencia, CAE., RPI. y enfoque de inteligencia."}',
    nuevo: '{id:"guiaPlanificacion",num:"F2·P15",nom:"Guía de Planificación del Comandante",...SIDGuiaPlan}',
    veces: 1,
  },
  {
    nombre: 'F6·P2 del Comandante: los seis párrafos de la Guía de Planificación Final',
    viejo: '{id:"guiaFinal",num:"F6·P2",nom:"Guía de Planificación Final",tipo:"filas",entrega:"SE DIFUNDE SÓLO AL ESTADO MAYOR",cols:["Área / Sección","Guía final impartida","Plazo"],nota:"La última guía: con ella el Estado Mayor escribe la Orden General de Operaciones y sus anexos. Habilita la Orden Preparatoria N° 3 del G-3."}',
    nuevo: '{id:"guiaFinal",num:"F6·P2",nom:"Guía de Planificación Final",...SIDGuiaFinal}',
    veces: 1,
  },
  {
    nombre: 'La hoja (yU): lo escrito con el cuadro viejo, en su párrafo',
    viejo: 'const v=e||(["filas","matriz"].includes(t.tipo)?[]:{});',
    nuevo: 'const v=SIDGuiaLeer(t,e)||e||(["filas","matriz"].includes(t.tipo)?[]:{});',
    veces: 1,
  },
  {
    nombre: 'El Word (Jq): lo escrito con el cuadro viejo, en su párrafo',
    viejo: 'function Jq(t,e={}){return t.tipo===',
    nuevo: 'function Jq(t,e={}){e=SIDGuiaLeer(t,e)||e;return t.tipo===',
    veces: 1,
  },
  {
    nombre: 'La IA (KD): lo escrito con el cuadro viejo, en su párrafo',
    viejo: 'function KD(t,e={},n){var a,i;const o=e||{};',
    nuevo: 'function KD(t,e={},n){var a,i;const o=SIDGuiaLeer(t,e)||e||{};',
    veces: 1,
  },
  {
    nombre: 'El pedido a la IA dice qué va en cada párrafo',
    viejo: 'return e.some(r=>r.tipo==="par")&&s.push(',
    nuevo: 'return t?.ayudaIA&&s.push(t.ayudaIA),e.some(r=>r.tipo==="par")&&s.push(',
    veces: 1,
  },
]
