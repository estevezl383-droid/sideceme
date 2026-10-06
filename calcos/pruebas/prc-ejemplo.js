// Ejercicio FICTICIO para la F3·P1 Potencia Relativa de Combate (prc.cjs y e2e/prc.cjs): una
// defensa propia de infantería contra un enemigo mecanizado; la hoja guardada con la forma
// VIEJA (los ocho sistemas operativos); lo que pegó Sergio en la captura (sólo la pregunta
// final de la IA); su indicación de las fases; y una respuesta de IA con el JSON del pedido.
const { ejercicioRiesgo } = require('./riesgo-ejercicio.js')

// Un ejercicio FICTICIO: una defensa propia de infantería contra un enemigo mecanizado.
const u = (bando, designacion, arma, escalon) => ({ id: designacion, tipo: 'unidad', bando, designacion, arma, escalon, lat: -17, lng: -65 })
const UNIDADES = [
  u('propias', 'RI-12 «TARIJA» (FICT.)', 'infanteria', 'batallon'),
  u('propias', 'RI-13 «CHACO» (FICT.)', 'infanteria', 'batallon'),
  u('propias', 'GA-3 «PISAGUA» (FICT.)', 'artilleria', 'grupo'),
  u('propias', 'RC-1 «AVAROA» (FICT.)', 'caballeria', 'escuadron'),
  u('enemigo', 'BIM-41 (FICT.)', 'mecanizada', 'batallon'),
  u('enemigo', 'BIM-42 (FICT.)', 'mecanizada', 'batallon'),
  u('enemigo', 'BT-7 (FICT.)', 'blindada', 'batallon'),
  u('enemigo', 'Cía. Mort. 120 (FICT.)', 'morteros', 'compania'),
  u('enemigo', 'Esc. Rec. Mec. (FICT.)', 'cabmec', 'escuadron'),
]
// La hoja con la forma VIEJA, como la guardó la Mesa hasta el 05-10-2026.
const VIEJA = {
  MANIOBRA: '4 unidad(es) propias contra 5 enemigas.',
  'MANIOBRA|PROPIAS': '4',
  'MANIOBRA|ENEMIGO': '5',
  'MANIOBRA|Relación y deducción': 'Relación 1 : 1.9. Inferioridad — apto para la DEFENSA.',
  'APOYO DE FUEGOS': '1 unidad(es) propias de apoyo de fuegos contra 1 enemigas.',
  'DEFENSA ANTIAÉREA': 'Sección AA orgánica (FICT.).',
  'MOVILIDAD / CONTRAMOVILIDAD / SUPERVIVENCIA|Relación y deducción': 'Al enemigo debería costarle 6 h abrirse paso.',
  'FACTORES INTANGIBLES (moral, adiestramiento, liderazgo)|ENEMIGO': 'Conscriptos con poco adiestramiento (FICT.).',
}
// Lo que pegó Sergio (captura): sólo la última línea de la respuesta de Gemini.
const PEGADO_CAPTURA = '¿Desea que profundicemos en la redacción de algún anexo específico de la Orden General de Operaciones o en el desarrollo detallado de la Matriz de Sincronización para el contraataque en el Área de Empeño VULCAN?'
// Lo que contestó Gemini en el segundo intento de Sergio (06-10-2026), con nombres
// FICTICIOS: un análisis METT-TC/OCOKA y «Conclusiones y decisiones», sin ninguna fila de la
// hoja, y la pregunta del final.
const RESPUESTA_FUERA_DE_TEMA = `De acuerdo al ejercicio académico de la ECEME, y bajo el rol de Oficial de Estado Mayor de la sección G-3 (Operaciones) de la DIV.MEC.-1 (FICT.), se presenta el análisis y producto correspondiente al planeamiento de la operación defensiva.
1. Análisis de Factores de Estado Mayor (METT-TC) y OCOKA

* Misión y Propósito: La DIV.MEC.-1 (FICT.) ejecuta una operación defensiva en ambiente de llanura y valle a partir del día D (0500) al D+2 (1800).
* Enemigo: La División Acorazada (FICT.) ataca bajo el Curso de Acción Más Probable (CAE-1: Ataque de Envolvimiento), apoyada por artillería de 155 mm (23 km de alcance).
* Terreno y Meteorología (OCOKA):
   * Observación y Campos de Tiro: Las elevaciones dominantes del Cerro X (FICT.) permiten la observación de largo alcance sobre el Área de Empeño VULCAN.
   * Meteorología: Estación seca, cielo despejado.

2. Conclusiones y Decisiones de Estado Mayor

* Reubicación del ASDI: Se determina la reubicación del Área de Servicios de la División a una distancia superior a los 12 km a retaguardia de la LPR.
* Sincronización del Contraataque: La defensa se estructurará en cuatro fases (Preparación, Defensa y Desorganización, Canalización, y Destrucción en el Área de Empeño VULCAN).

¿Desea que profundicemos en la redacción de algún anexo específico de la Orden General de Operaciones o en el desarrollo detallado de la Matriz de Sincronización del contraataque en el Área de Empeño VULCAN?`
const INDICACION = 'OCUPACIÓN DE LA DEFENSA, OTRA FASE DE DESORGANIZACIÓN, OTRA DE CANALIZACIÓN Y FINALMENTE UNA DE CANALIZACIÓN Y DESTRUCCIÓN.'
const fila = (e, p, d, t) => ({ enemigas: e, propias: p, deducciones: d, ttp: t })
const RESPUESTA_JSON = `Acá va la hoja:

\`\`\`json
${JSON.stringify(
  {
    MANIOBRA: fila('+Movilidad táctica sobre la RN-7 (FICT.).\n+Puede desmontarse.\n-Depende de la carretera en el valle.', '+Terreno cerrado al este de la LDA (FICT.).\n-No pueden reubicarse rápidamente.', 'Fase de canalización: obligarlo a dejar la RN-7 por el corredor norte.\nObligar al enemigo a desmontarse.', 'Fase de canalización: obstáculos escalonados en el corredor norte.\nEmboscada antitanque (AT).'),
    'POTENCIA DE FUEGO': fila(['+Morteros de 120 mm (FICT.).', '-Sin artillería de campaña.'], '+GA-3 en apoyo directo (FICT.).', 'Nuestra artillería supera su alcance.', 'Fase de desorganización: fuegos de contrapreparación sobre la ZR enemiga.'),
    PROTECCIÓN: fila('+Enemigo blindado.\n-Tiempo para reabastecerse.', '+Tiempo para fortificar.\n-Vulnerables a sus morteros.', 'Deben sobrevivir sus fuegos de preparación.', 'Establecer posiciones alternativas y escondites.'),
    LIDERAZGO: fila('-C2 centralizado.', '+C2 descentralizado.', 'Deben ensayar la ejecución descentralizada.', 'Ensayar la conducción por fases.'),
    'INFORMACIÓN E INTELIGENCIA': fila('+Escuadrón de reconocimiento mecanizado.', '+RC-1 conoce el terreno.', 'Esfuerzos vigorosos de contrarreconocimiento.', 'Destruir su reconocimiento en la zona de seguridad.'),
  },
  null,
  2
)}
\`\`\`
`
const CABECERA = '| Potencia de combate | Fuerzas enemigas | Fuerzas propias | Deducciones | Tácticas, técnicas y procedimientos (TTP.) |'

// El ejercicio de la matriz de riesgo (Orden, documento aportado, Línea de Tiempo) con estas
// unidades y la PRC guardada con la forma vieja, SIN la fila de maniobra (así 🌱 la llena).
function ejercicioPRC() {
  const e = ejercicioRiesgo()
  e.nombre = 'PRUEBA PRC (FICT.)'
  e.unidades = UNIDADES.map((x) => ({ ...x, lat: x.bando === 'enemigo' ? -16.7 : -16.9, lng: -68.3 }))
  const vieja = { ...VIEJA }
  for (const k of Object.keys(vieja)) if (k.startsWith('MANIOBRA')) delete vieja[k]
  e.g3.potencia = vieja
  return e
}

module.exports = { UNIDADES, VIEJA, PEGADO_CAPTURA, RESPUESTA_FUERA_DE_TEMA, INDICACION, RESPUESTA_JSON, CABECERA, ejercicioPRC }
