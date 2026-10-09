// La DOCTRINA de logística que usa la Mesa para el ASDI / ARCE, la evaluación de las áreas
// propuestas, la Apreciación de Situación de Logística y la Matriz de Sincronización.
//
// Todo sale de los tres textos de la Escuela que mandó Sergio el 02-10-2026 (se cita cada
// dato con FUENTES.x y el apartado). No se inventan cifras: lo que la Mesa agrega por su
// cuenta (por ejemplo, comparar las áreas entre sí) se dice como «criterio de la Mesa».
// Sin DOM: se prueba en Node.

export const FUENTES = {
  dia: 'UU. CMDO. LOG. 2022 (diapositivas, ECEME, 16/17-MAR-22)',
  texto: 'Texto «Unidades de Comandos Logísticos» (ECEME)',
  clfftt: 'Texto del CLFFTTTO 2016 (ECEME)',
}

// ─── Datos generales de planeamiento logístico (lámina «DATOS GENERALES…») ──────────
export const TAMANO = [
  { id: 'at', nom: 'Área de trenes de unidad', min: 1, max: 2, nota: '1 hasta 2 km²' },
  { id: 'div', nom: 'Área de apoyo logístico de División (ASDI)', min: 6, max: 9, nota: '6 hasta 9 km²' },
  { id: 'ce', nom: 'Área de apoyo logístico de Cuerpo de Ejército (ARCE)', min: 9, max: 12, nota: '9 hasta 12 km²' },
]
export const SEGURIDAD = [
  { id: 'at', nom: 'Área de trenes de unidad', min: 5, nota: 'mínimo 5 km' },
  { id: 'div', nom: 'Área de apoyo logístico de División (ASDI)', min: 12, nota: 'mínimo 12 km' },
  { id: 'ce', nom: 'Área de apoyo logístico de Cuerpo de Ejército (ARCE)', min: 25, nota: 'mínimo 25 km' },
]
export const OBS_SEGURIDAD =
  'En operaciones ofensivas se mide a partir de la LC (línea de contacto). En operaciones defensivas, a partir de las últimas posiciones de bloqueo del escalón considerado. Es la MENOR distancia, en línea recta, admitida entre el área y la LC o la LPR; hay que considerar además el alcance del material de artillería enemigo. Es un aspecto IMPOSITIVO.'
export const TONELAJE_BATALLON = [
  { id: 'motorizada', nom: 'Tropas motorizadas', t: 25 },
  { id: 'mecanizada', nom: 'Tropas mecanizadas', t: 30 },
  { id: 'blindada', nom: 'Tropas blindadas', t: 40 },
  { id: 'art155', nom: 'Artillería 155 mm', t: 40 },
  { id: 'otras', nom: 'Otras unidades', t: 25 },
]
export const TONELAJE_DIVISION = [
  { id: 'motorizada', nom: 'Tropas motorizadas', t: 160 },
  { id: 'mecanizada', nom: 'Tropas mecanizadas', t: 230 },
  { id: 'blindada', nom: 'Tropas blindadas', t: 270 },
]
export const FUENTE_DATOS = `${FUENTES.dia}, lámina «Datos generales de planeamiento logístico».`

// Qué fila de la tabla corresponde a cada clase de área del calco.
export const NIVEL_DE_ZONA = { asdi: 'div', arce: 'ce', at: 'at', atcamp: 'at', atcomb: 'at', atsu: 'at' }
export const nivelDeZona = (zona) => NIVEL_DE_ZONA[zona] || 'div'
export const tamanoDe = (nivel) => TAMANO.find((x) => x.id === nivel) || TAMANO[1]
export const seguridadDe = (nivel) => SEGURIDAD.find((x) => x.id === nivel) || SEGURIDAD[1]

// ─── Distancia máxima de apoyo (DMA) ────────────────────────────────────────────────
// DMA = (TD − TC) × V / 2 (ida y vuelta). Ejemplo de la lámina: (10 − 2) × 20 / 2 = 80 km.
export const DMA_BASE = { td: 10, tc: 2, v: 20 }
export const DMA_NOTA =
  'Es la MAYOR distancia, medida por carretera, admitida entre el área de apoyo logístico y las áreas de trenes de las unidades de combate. Es un factor IMPOSITIVO. TD: tiempo diario de operación del conductor (10 h); TC: tiempo de carga, descarga y maniobra (2 h); V: velocidad media nocturna que fija el escalón superior (20 km/h; 30 km/h para la Sección Base y la Avanzada). DMA = (TD − TC) × V / 2.'
export const DMA_INFLUYEN = ['Características de la región de operaciones (terreno)', 'Posibilidades del enemigo', 'Condicionantes de los transportes (medios disponibles)', 'Grado de seguridad deseado (si se admite el desplazamiento diurno)']
export function calcularDMA({ td = DMA_BASE.td, tc = DMA_BASE.tc, v = DMA_BASE.v } = {}) {
  const TD = Number(td)
  const TC = Number(tc)
  const V = Number(v)
  if (![TD, TC, V].every(Number.isFinite) || TD <= TC || V <= 0) return { ok: false, km: 0, error: 'TD tiene que ser mayor que TC y la velocidad mayor que cero.' }
  const horas = TD - TC
  const km = (horas * V) / 2
  return { ok: true, km, horas, texto: `DMA = (${TD} − ${TC}) × ${V} / 2 = ${horas} × ${V} / 2 = ${fmt(km)} km` }
}
const fmt = (x) => (Math.round(x * 10) / 10).toLocaleString('es')

// ─── ASDI, ARCE y el esquema en profundidad ─────────────────────────────────────────
// Lo que el oficial necesita ENTENDER antes de trazar. Cada tarjeta dice de dónde sale.
export const ENTENDER = [
  {
    id: 'que-es',
    titulo: '¿Qué es un área de apoyo logístico?',
    texto:
      'Es la región donde un escalón despliega sus instalaciones logísticas (puestos de distribución de las clases, mantenimiento, sanidad, transporte y personal) para apoyar a sus tropas. En la División la despliega el BATALLÓN LOGÍSTICO y la localiza el G-4; en el Cuerpo de Ejército, sus unidades logísticas. Su elección se apoya en cuatro FACTORES: MANIOBRA, TERRENO, SEGURIDAD y SITUACIÓN LOGÍSTICA.',
    fuente: `${FUENTES.dia}, «El Batallón Logístico — factores de empleo».`,
  },
  {
    id: 'asdi',
    titulo: 'ASDI — Área de Servicios de la División (área de apoyo logístico de la División)',
    texto:
      'Es el área del Batallón Logístico de la División: ahí van los Puestos de Distribución de la GU., las áreas de mantenimiento y el Puesto de Clasificación y Evacuación. Tamaño: 6 a 9 km². Distancia de seguridad: mínimo 12 km de la LC o de la LPR. Tiene que quedar dentro de la DISTANCIA MÁXIMA DE APOYO de las áreas de trenes de los regimientos que apoya. La traza el G-4 de la DIVISIÓN.',
    fuente: `${FUENTES.dia}, «Datos generales de planeamiento logístico» y «Factor maniobra».`,
  },
  {
    id: 'arce',
    titulo: 'ARCE — Área de Retaguardia del Cuerpo de Ejército (área de apoyo logístico del CE)',
    texto:
      'Es el equivalente del ASDI un escalón más arriba: el área donde el Cuerpo de Ejército despliega SUS instalaciones logísticas, más atrás y más grande. Tamaño: 9 a 12 km². Distancia de seguridad: mínimo 25 km. Para la División es el ESCALÓN SUPERIOR: de ahí recibe, y ahí se ubican los puestos de abastecimiento avanzados de Clase III y Clase V que el CE adelanta hacia el ASDI. Si sos G-4 de una División, el ARCE NO lo elegís vos: lo da la Orden del CE y lo graficás como referencia para medir el factor SITUACIÓN LOGÍSTICA.',
    fuente: `${FUENTES.dia}, «Datos generales…» y «Factor situación logística»; catálogo de la Mesa (ARCE = equivalente del ASDI en el CE).`,
  },
  {
    id: 'diferencia',
    titulo: 'Entonces, ¿cuál es la diferencia?',
    texto:
      'La misma función en dos escalones. ASDI = División, adelante, 6-9 km², a ≥ 12 km. ARCE = Cuerpo de Ejército, atrás, 9-12 km², a ≥ 25 km. El flujo va de atrás hacia adelante: Zona del Interior → Base Logística → Zona de Etapas (Sección Base → Sección Avanzada, una por CE) → ARCE (CE) → ASDI (División) → áreas de trenes de los regimientos y batallones (1-2 km², a ≥ 5 km) → la tropa. La evacuación hace el camino inverso.',
    fuente: `${FUENTES.dia}, «Flujo de abastecimiento desde la ZI hasta la ZC»; ${FUENTES.texto}, Cap. III.`,
  },
  {
    id: 'retaguardia',
    titulo: 'El área de retaguardia y su seguridad (SEGAR)',
    texto:
      'El área de retaguardia es la parte del AO comprendida entre los límites de retaguardia del escalón subordinado y el límite de retaguardia de la propia fuerza. Ahí va la mayor parte de las instalaciones logísticas, la reserva, las de apoyo de combate y las de comando: concentra blancos de alto valor. Por eso se planifica su SEGURIDAD (SEGAR = Defensa del Área de Retaguardia, DEFAR, y Control de Daños de Área, CDA), según el NIVEL DE AMENAZA (I, II o III) que surge del CAE que expone el G-2.',
    fuente: `${FUENTES.dia}, «Ejercicio práctico N° 5 y 6»; ${FUENTES.texto}, Cap. V.`,
  },
  {
    id: 'como',
    titulo: 'Cómo se elige (el método de la Escuela)',
    texto:
      '1) Proponé dos o tres áreas posibles (A, B…) sobre el terreno. 2) Verificá lo IMPOSITIVO: tamaño, distancia de seguridad y distancia máxima de apoyo; el área que no cumple queda descartada. 3) Evaluá cada aspecto de los cuatro factores en la matriz «Evaluación de las áreas propuestas»: casilla pintada = el área reúne el aspecto. 4) Concluí: qué áreas tienen condiciones y cuál tiene ventaja, y por qué aspectos. 5) Elegí y desplegá ahí el Batallón Logístico.',
    fuente: `${FUENTES.dia}, «Evaluación de las áreas propuestas — ejemplo de solución».`,
  },
]

// ─── Factores y aspectos de la «EVALUACIÓN DE LAS ÁREAS PROPUESTAS» ──────────────────
// Mismo orden y mismas palabras que la lámina; la definición, del texto de la Escuela.
export const FACTORES = [
  {
    id: 'maniobra',
    nom: 'MANIOBRA',
    color: '#ff2a2a',
    aspectos: [
      { id: 'm_cerrado', nom: 'Apoyo cerrado a los elementos de 1° escalón', def: 'Distancia, medida por carreteras, hasta los elementos a apoyar: el apoyo es más cerrado cuanto menor sea. Es prioritaria la zona de acción del elemento que realiza el ataque principal o que defiende el sector más importante del frente.' },
      { id: 'm_accion', nom: 'Favorecimiento de la acción táctica', def: 'Posición relativa del área respecto del ataque principal (o del empleo de la mayoría de los medios en la defensa), considerada la red viaria: cuanto más direccionada por carretera hacia el esfuerzo, mejor.' },
      { id: 'm_dma', nom: 'Distancia máxima de apoyo', def: 'Mayor distancia, por carretera, admitida entre el área y las áreas de trenes de las unidades de combate. Factor IMPOSITIVO.', impositivo: true },
      { id: 'm_continuidad', nom: 'Continuidad del apoyo', def: 'Capacidad de apoyar a todos los elementos hasta el fin de la operación con el mínimo de cambios de posición. Lo ideal es apoyar toda la maniobra desde una sola área.' },
      { id: 'm_reserva', nom: 'Interferencia con la reserva', def: 'Que el área no dificulte el desplazamiento de la reserva y de las unidades de apoyo al combate, ni les quite el espacio de las instalaciones de comando y de las zonas de reunión.' },
    ],
  },
  {
    id: 'terreno',
    nom: 'TERRENO',
    color: '#19d219',
    aspectos: [
      { id: 't_red', nom: 'Red viaria compatible', def: 'Capacidad de tráfico de las vías: ligación con el escalón superior, con los elementos apoyados y circulación interna.' },
      { id: 't_construcciones', nom: 'Existencia de construcciones', def: 'Cantidad, tipo y disposición de construcciones aprovechables (haciendas, instalaciones industriales, hospitales, escuelas…).' },
      { id: 't_cubiertas', nom: 'Cubiertas y abrigos', def: 'Cubiertas y abrigos naturales que den ocultación y protección (configuración del terreno y cobertura vegetal).' },
      { id: 't_obstaculos', nom: 'Obstáculos en el interior del área', def: 'Ríos, pantanos, vías férreas… que corten la circulación interna o periférica, dividan el área o reduzcan su espacio útil (desfavorable si los hay).' },
      { id: 't_responsabilidad', nom: 'Disminución de la responsabilidad territorial', def: 'Ubicar el área más a retaguardia AUMENTA la responsabilidad territorial del escalón: es favorable el área que la disminuye.' },
      { id: 't_suelo', nom: 'Consistencia del suelo y existencia de agua', def: 'Suelo consistente para la circulación de vehículos; fuentes de agua, sus condiciones de explotación y la calidad del agua.' },
    ],
  },
  {
    id: 'seguridad',
    nom: 'SEGURIDAD',
    color: '#ff9fd3',
    grupos: [
      { id: 'flujo', nom: 'Seguridad del flujo' },
      { id: 'instalaciones', nom: 'Seguridad de las instalaciones' },
    ],
    aspectos: [
      { id: 's_distEne', grupo: 'flujo', nom: 'Distancia de apoyo × posibilidades del enemigo', def: 'Cuanto mayor la distancia a recorrer para apoyar, mayor la posibilidad de que el enemigo (infiltrado, guerrillero, paracaidista o aéreo) intervenga sobre el flujo.' },
      { id: 's_puntos', grupo: 'flujo', nom: 'Puntos críticos y posibilidades del enemigo', def: 'Puntos críticos a lo largo del eje principal de abastecimiento (puentes, desfiladeros, pasos obligados) que el enemigo puede usar para restringir o impedir el flujo.' },
      { id: 's_epaEne', grupo: 'flujo', nom: 'EPA × posibilidades del enemigo', def: 'Posición de los probables EPA respecto de las regiones aptas para ocultar guerrilleros o infiltrados o para lanzar paracaidistas.' },
      { id: 's_epaFlancos', grupo: 'flujo', nom: 'EPA × flancos expuestos', def: 'Proximidad de los EPA a los flancos expuestos a las penetraciones del enemigo.' },
      { id: 's_dispersion', grupo: 'instalaciones', nom: 'Dispersión y apoyo mutuo', def: 'Si el espacio del área da seguridad a las instalaciones según sus distancias de despliegue (dimensión del área — 6 km² — y distancias entre instalaciones).' },
      { id: 's_defensa', grupo: 'instalaciones', nom: 'Facilidad para defensa', def: 'Elevaciones para puestos de vigilancia, límites del área apoyados en ríos u obstáculos, ausencia de áreas o puntos favorables a la infiltración.' },
      { id: 's_amiga', grupo: 'instalaciones', nom: 'Proximidad de tropa amiga', def: 'Desplegar el área cerca de tropas que puedan contribuir a su seguridad.' },
      { id: 's_flancos', grupo: 'instalaciones', nom: 'Flancos expuestos o protegidos', def: 'Alejamiento de los flancos expuestos a la penetración del enemigo, o proximidad de flancos protegidos por tropas u obstáculos de bulto.' },
      { id: 's_distSeg', grupo: 'instalaciones', nom: 'Distancia de seguridad', def: 'Menor distancia, en línea recta, admitida entre el área y la LC o la LPR; considerar el alcance de la artillería enemiga. Aspecto IMPOSITIVO.', impositivo: true },
    ],
  },
  {
    id: 'situacion',
    nom: 'SITUACIÓN LOGÍSTICA',
    color: '#ffc000',
    aspectos: [
      { id: 'l_superior', nom: 'Actual localización de las instalaciones logísticas del escalón superior', def: 'Posición relativa del área respecto de la base / instalaciones logísticas que apoyan a la División, considerando la ligación viaria.' },
      { id: 'l_bonlog', nom: 'Situación actual del Bat Log', def: 'Una región es favorecida si el Batallón Logístico ya se encuentra desplegado allí, total o parcialmente.' },
      { id: 'l_trenes', nom: 'Localización actual de las áreas de trenes de los elementos apoyados', def: 'Posición relativa del área respecto de las áreas de trenes de los elementos apoyados, considerada la orientación de la red viaria.' },
      { id: 'l_epa', nom: 'EPA en uso o prevista', def: 'Los EPA usados para la ligación con el escalón superior: capacidad de tráfico, extensión de los recorridos, reconocimiento de las vías, medios de transporte y elementos a apoyar.' },
      { id: 'l_avanzadas', nom: 'Localización de las instalaciones logísticas avanzadas del escalón superior', def: 'Principalmente los puestos de abastecimiento avanzados de Clase III y Clase V (M) que el escalón superior despliega más cerca del área.' },
    ],
  },
]
export const ASPECTOS = FACTORES.flatMap((f) => f.aspectos.map((a) => ({ ...a, factor: f.id, factorNom: f.nom })))
export const aspecto = (id) => ASPECTOS.find((a) => a.id === id) || null
export const OTROS_FACTORES = ['Sigilo de las operaciones', 'Actitud de la población', 'Optimización de los transportes', 'Limitación de los medios de transporte', 'Plazos', 'Duración de la operación', 'Necesidad de abrir una subárea de apoyo logístico']
export const FUENTE_FACTORES = `${FUENTES.dia}, «Factores de empleo» (maniobra, terreno, seguridad, situación logística) y lámina «Evaluación de las áreas propuestas».`
export const EJEMPLO_CONCLUSION =
  'LAS ÁREAS A Y B TIENEN CONDICIONES DE REALIZAR EL APOYO LOGÍSTICO A LA MANIOBRA DE LA 1ª DIVISIÓN DE EJÉRCITO, MIENTRAS QUE EL ÁREA A TIENE LA VENTAJA EN RELACIÓN AL ÁREA B, CONSIDERANDO LOS ASPECTOS APOYO CERRADO A LOS ELEMENTOS DE 1º ESCALÓN, COMPATIBILIDAD DE LA RED VIARIA, DISMINUCIÓN DE LA RESPONSABILIDAD TERRITORIAL Y FACILIDAD DE DEFENSA.'

// ─── Seguridad del área de retaguardia: niveles de amenaza ──────────────────────────
export const NIVELES_AMENAZA = [
  { id: 'I', nom: 'Nivel I', que: 'Agentes saboteadores y terroristas.', quien: 'Se derrotan con la defensa propia de las unidades del área de retaguardia.', medidas: ['Dotar al máximo los puestos de observación', 'Aumentar la guardia y registrar los vehículos', 'Incrementar la seguridad del área de retaguardia', 'Designar personal para la defensa del perímetro', 'Aumentar la protección de instalaciones clave'] },
  { id: 'II', nom: 'Nivel II', que: 'Diversión y sabotaje de fuerzas no convencionales; incursiones, emboscadas y reconocimientos de pequeñas unidades de combate.', quien: 'Exceden la defensa propia: las derrota una fuerza de reacción (p. ej. Policía Militar con fuegos de apoyo).', medidas: ['Controlar rígidamente los accesos a todas las áreas', 'Reforzar la defensa del perímetro', 'Puestos de observación listos para retirarse', 'Fuerza de reacción en alerta permanente'] },
  { id: 'III', nom: 'Nivel III', que: 'Operaciones helitransportadas, aerotransportadas o anfibias; penetración desde el área de combate; infiltración; pequeñas operaciones terrestres de conexión y asalto.', quien: 'Requieren el empleo de una fuerza táctica.', medidas: ['Se retiran los puestos de observación', 'La fuerza de reacción acomete contra la amenaza', 'Cesan las operaciones de apoyo', 'Normalmente se anticipa con fuego de artillería o asaltos aéreos'] },
]
export const FUENTE_AMENAZA = `${FUENTES.texto}, Cap. V, IV.- Niveles de amenaza.`

// ─── Influencia del tipo de operación en el apoyo logístico ─────────────────────────
export const OPERACIONES = [
  { id: 'ataque', nom: 'Ataque', despliegue: 'El Bat. Log. se despliega lo más adelante posible (apoyo cerrado y continuo, sin cambio de área durante las acciones), por el flanco menos expuesto, cerca de tropas amigas y a la distancia mínima de seguridad de la artillería enemiga. Despliegue amplio.', enfoque: ['cl3', 'cl5', 'evacuacion', 'mantenimiento', 'transporte'], clases: 'Cl I ración operativa (seca); Cl III consumo elevado; Cl V (M) consumo elevado desde la preparación; Cl VIII gran consumo (dotación máxima antes del ataque).', otros: 'Transporte intenso; mantenimiento: escuadras móviles en apoyo directo al 1er escalón; sanidad lo más adelante posible, evacuación aeromédica; personal: reemplazos y moral.' },
  { id: 'defensa', nom: 'Defensa', despliegue: 'Máxima centralización y amplio despliegue de las instalaciones; estabilidad, pero mayor necesidad de seguridad contra fuegos e infiltrados. Posible despliegue en el área de retaguardia del CE según las medidas de coordinación. Organizar los medios para no interferir con la maniobra ante una penetración.', enfoque: ['cl4', 'cl5', 'evacuacion'], clases: 'Elevación de abastecimientos Cl IV y V; en la defensa móvil puede crecer el consumo de Cl III.', otros: 'Flexibilidad para los cambios de actitud del combate.' },
  { id: 'retrograda', nom: 'Operaciones retrógradas', despliegue: 'Mínimo despliegue, instalaciones sobre vehículos, repliegue anticipado de las instalaciones y medios pesados; alargamiento inicial de las distancias de apoyo; pequeños depósitos a lo largo del itinerario; plan de destrucción.', enfoque: ['cl3', 'transporte'], clases: 'Entregas en cantidades mínimas; elevación de Cl III; bajo nivel en los depósitos.', otros: 'Subáreas de apoyo logístico o procesos alternativos para la continuidad.' },
  { id: 'marcha', nom: 'Marcha de aproximación', despliegue: 'Despliegue en posiciones sucesivas a lo largo del eje del grueso; total (plazos largos) o parcial (movimiento). Puede hacer falta una subárea de apoyo logístico. Cambio de área cuando la distancia se acerca a la DMA, al estancarse las acciones o tras conquistar los objetivos de marcha.', enfoque: ['cl3', 'mantenimiento'], clases: 'Alto consumo de Cl III; reducido Cl V (M); pocas bajas.', otros: 'Escuadras de mantenimiento móvil en apoyo directo o refuerzo.' },
  { id: 'explotacion', nom: 'Explotación del éxito y persecución', despliegue: 'Actividades descentralizadas; despliegue parcial; destacamento logístico o procesos especiales para cerrar el apoyo; el transporte de Cl III y V puede limitar la profundidad de la explotación.', enfoque: ['cl3', 'cl5', 'transporte'], clases: 'Cl I ración de combate; Cl III muy elevado; Cl V en aumento; Cl VIII bajo; repuestos elevados.', otros: 'Seguridad de las columnas (enemigo sobrepasado); abastecimiento aéreo; evacuación de material capturado.' },
  { id: 'reconocimiento', nom: 'Reconocimiento y seguridad', despliegue: 'Despliegue parcial sobre ruedas, subárea de apoyo logístico, cambios de área a regiones preseleccionadas, sincronización por líneas de control, DMA hasta su límite y medidas especiales de seguridad del flujo.', enfoque: ['cl3', 'transporte'], clases: '', otros: 'Descentralización de los medios.' },
]
export const FUENTE_OPERACIONES = `${FUENTES.dia}, «Apoyo a las principales operaciones» y «Influencias…» por tipo de operación.`
export const operacion = (id) => OPERACIONES.find((o) => o.id === id) || null
// La operación que sugiere el Área de Operaciones (tipo «defensiva» u «ofensiva»).
export function operacionDeAO(areaOps) {
  const t = String(areaOps?.tipo || '').toLowerCase()
  if (/defens/.test(t)) return 'defensa'
  if (/retr|retard|repl/.test(t)) return 'retrograda'
  if (/ofens|ataq/.test(t)) return 'ataque'
  return ''
}

// ─── Enfoques de apoyo (los mismos de la pestaña «🎬 Concepto» del G-4) ───────────────
export const ENFOQUES = [
  { id: 'transporte', nom: 'Transporte' },
  { id: 'cl1', nom: 'Abastecimiento Clase I' },
  { id: 'agua', nom: 'Agua' },
  { id: 'cl3', nom: 'Abastecimiento Clase III' },
  { id: 'cl4', nom: 'Abastecimiento Clase IV' },
  { id: 'cl5', nom: 'Abastecimiento Clase V' },
  { id: 'mantenimiento', nom: 'Mantenimiento' },
  { id: 'evacuacion', nom: 'Evacuación y hospitalización' },
  { id: 'personal', nom: 'Apoyo de personal' },
]
export const nombreEnfoque = (id) => ENFOQUES.find((e) => e.id === id)?.nom || id

// ─── Matriz de sincronización logística (lámina de la Escuela) ──────────────────────
// Cada renglón: su rótulo (como en la lámina), qué se pone y con qué se llena desde el
// calco. «calco» dice qué herramienta de la Mesa lo grafica (para «acostar»).
export const FILAS_MATRIZ = [
  { id: 'secciones', rot: 'UBICACIÓN DE LAS SECCIONES BASE, AVANZADAS O ESPECIALES', guia: 'Dónde están (o se instalan) la Sección Base, la Avanzada o la Especial de la Zona de Etapas que apoyan a la operación en esa fase.', calco: 'zonalog' },
  { id: 'enfoque', rot: 'ENFOQUE DE APOYO LOGÍSTICO', guia: '¿A qué función logística va dirigido el esfuerzo?' },
  { id: 'prioridad', rot: 'PRIORIDAD DE APOYO', guia: 'El orden o la precedencia de apoyo a cada componente.' },
  { id: 'abast_centros', grupo: 'ABASTECIMIENTO', rot: 'Ubicación de los Centros de Abastecimiento (Depósitos)', guia: 'El área (ASDI/ARCE) y los puestos de distribución.', calco: 'zonalog' },
  { id: 'abast_ejes', grupo: 'ABASTECIMIENTO', rot: 'EPA / ESA', guia: 'Eje Principal y Eje Secundario de Abastecimiento.', calco: 'epa' },
  { id: 'evac_hosp', grupo: 'EVACUACIÓN Y HOSPITALIZACIÓN', rot: 'Hospitales · Norma de evacuación · PA', guia: 'Hospitales / PCED, norma de evacuación y prioridad de apoyo.' },
  { id: 'evac_ejes', grupo: 'EVACUACIÓN Y HOSPITALIZACIÓN', rot: 'EPE / ESE', guia: 'Eje Principal y Eje Secundario de Evacuación.', calco: 'epe' },
  { id: 'transporte', rot: 'TRANSPORTE', guia: 'Prioridad de movimiento · PA.' },
  { id: 'mantenimiento', rot: 'MANTENIMIENTO', guia: 'Centros de mantenimiento de … en … · Prioridad de mantenimiento a …' },
  { id: 'recuperacion', rot: 'RECUPERACIÓN', guia: 'Centro de recolección en …' },
  { id: 'amenaza', rot: 'NIVEL DE AMENAZA EN EL ÁREA DE RETAGUARDIA', guia: 'De acuerdo a lo expuesto por el C-2 en el CAE: corresponde para la Seguridad del Área de Retaguardia (SAR).' },
]
export const SIGLAS_MATRIZ = [
  ['EPA', 'Eje Principal de Abastecimiento'],
  ['ESA', 'Eje Secundario de Abastecimiento'],
  ['EPE', 'Eje Principal de Evacuación'],
  ['ESE', 'Eje Secundario de Evacuación'],
  ['PA', 'Prioridad de Apoyo'],
  ['CAE', 'Curso de Acción del Enemigo'],
]

// ─── Apreciación de Situación de Logística (forma de la Mesa / PMTD) ────────────────
export const ESTUDIO_SITUACION = `${FUENTES.dia}, «Estudio de situación de logística»: 1. Análisis de la misión (misión de la fuerza apoyada, misión del Bat. Log., condiciones de ejecución, conclusiones); 2. Situación y cursos de acción; 3. Análisis de los CA (elección de las áreas de apoyo logístico, formas de apoyo, situación de comando, situación logística, ejes, niveles, DMA, seguridad); 4. Comparación; 5. Decisión.`
export const NIVELES_ABAST = 'Nivel operativo (NO): lo necesario entre dos pedidos o dos provisiones sucesivas. Nivel de seguridad (NS): días además del NO en poder de las tropas. Nivel máximo de abastecimiento NMA = NO + NS. Tiempo de pedido y remisión TPR = TP + TR. RL = NMA + TPR.'
export const FUNDAMENTOS = ['Objetivo', 'Simplicidad', 'Sentido de flujo', 'Economía', 'Sorpresa', 'Seguridad', 'Flexibilidad', 'Continuidad', 'Movilidad', 'Oportunidad']

// Texto de doctrina que va en los pedidos a la IA (corto: la IA no necesita las láminas).
export function doctrinaParaIA({ conFactores = true, conMatriz = false, conAmenaza = true } = {}) {
  const L = []
  L.push('# DOCTRINA DE LA ESCUELA (úsala; no la copies)')
  L.push(`Fuentes: ${FUENTES.dia}; ${FUENTES.texto}; ${FUENTES.clfftt}.`)
  L.push('')
  L.push('## ASDI y ARCE')
  for (const t of ENTENDER.filter((x) => ['asdi', 'arce', 'diferencia', 'retaguardia'].includes(x.id))) L.push(`- ${t.titulo}: ${t.texto}`)
  L.push('')
  L.push('## Datos generales de planeamiento logístico')
  L.push(`- Tamaño: ${TAMANO.map((x) => `${x.nom} ${x.nota}`).join('; ')}.`)
  L.push(`- Distancia de seguridad: ${SEGURIDAD.map((x) => `${x.nom} ${x.nota}`).join('; ')}. ${OBS_SEGURIDAD}`)
  L.push(`- Tonelaje mínimo/día para los ejes de abastecimiento, valor Batallón: ${TONELAJE_BATALLON.map((x) => `${x.nom} ${x.t} t`).join(', ')}; valor División: ${TONELAJE_DIVISION.map((x) => `${x.nom} ${x.t} t`).join(', ')}.`)
  L.push(`- Distancia máxima de apoyo: ${DMA_NOTA}`)
  if (conFactores) {
    L.push('')
    L.push('## Factores para localizar el área de apoyo logístico (evaluación de las áreas propuestas)')
    for (const f of FACTORES) {
      L.push(`### ${f.nom}`)
      for (const a of f.aspectos) L.push(`- [${a.id}] ${a.nom}${a.impositivo ? ' (IMPOSITIVO)' : ''}: ${a.def}`)
    }
    L.push(`- Otros factores: ${OTROS_FACTORES.join(', ')}.`)
    L.push(`- Ejemplo de conclusión de la Escuela: «${EJEMPLO_CONCLUSION}»`)
  }
  if (conAmenaza) {
    L.push('')
    L.push('## Niveles de amenaza en el área de retaguardia (SAR)')
    for (const n of NIVELES_AMENAZA) L.push(`- ${n.nom}: ${n.que} ${n.quien}`)
  }
  L.push('')
  L.push('## Influencia del tipo de operación')
  for (const o of OPERACIONES) L.push(`- ${o.nom}: ${o.despliegue} ${o.clases ? `Clases: ${o.clases}` : ''}`)
  if (conMatriz) {
    L.push('')
    L.push('## Matriz de sincronización logística (renglones de la lámina)')
    for (const f of FILAS_MATRIZ) L.push(`- [${f.id}] ${f.grupo ? `${f.grupo} — ` : ''}${f.rot}: ${f.guia}`)
    L.push(`- Siglas: ${SIGLAS_MATRIZ.map(([a, b]) => `${a} = ${b}`).join('; ')}.`)
  }
  return L.join('\n')
}
