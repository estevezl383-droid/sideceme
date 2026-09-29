// Trabajar la hoja de CONCEPTOS ENTRELAZADOS con IA, igual que las demás hojas de la
// Mesa: se arma un PEDIDO con el expediente completo del ejercicio, la doctrina de la
// hoja, la JERARQUÍA (escalones y magnitudes), la opción que eligió el oficial, lo que
// la Mesa ya identificó y sus orientaciones; la IA contesta con un JSON y la Mesa lo
// vuelca en la hoja —poniendo cada unidad en su escalón aunque la IA se equivoque—
// (sin DOM: se prueba en Node).
import { normalizarConceptos, ENFOQUES, GRUPOS, ARMAS, CAMPOS, tipoUnidad, limpio, nombreUnidad, antecedentesConceptos, nuevoId, magnitudDeEscalon, escalonDeNombre, escalonDeUnidad, mismaUnidad, lecturaDelEjercicio, acomodarJerarquia, unidadPropiaDelEjercicio, ESCALON } from './modelo.js'

const TEXTOS = ['tarea', 'proposito', 'paf', 'efecto', 'pe', 'pt', 'prioridad']
const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const clave = (s) => sinTildes(s).toUpperCase().replace(/[«»“”"'().,\-–—\s]+/g, ' ').trim()

const ENCABEZADO_POR_DEFECTO = `CONTEXTO — ESTO ES UN EJERCICIO ACADÉMICO de la ESCUELA DE COMANDO Y ESTADO MAYOR
DEL EJÉRCITO DE BOLIVIA (ECEME). La situación, las unidades y el «enemigo» son SUPUESTOS
creados por el instructor para enseñar el método.

Sos OFICIAL DE ESTADO MAYOR del Ejército de Bolivia, egresado de la ECEME, y trabajás
dentro del PROCESO MILITAR DE TOMA DE DECISIONES (PMTD 2017).`

// Doctrina de la hoja (PMTD 2017, RO-01-02-06): Cap. II «Analizar la misión», primer
// paso; hoja de trabajo de la pág. 20; ejemplo de las págs. 21-22; enunciado del
// curso de acción (maniobra, apoyo de fuegos, MCS, DAA, sostenimiento). La jerarquía y
// sus magnitudes, como las indicó el docente.
const DOCTRINA = `QUÉ ES ESTA HOJA (PMTD 2017, Cap. II, Primer paso del Análisis de la Misión):
«Los conceptos entrelazados se realizan con el fin de establecer su posición tanto vertical
como horizontal y no solamente para las operaciones de maniobra; sino también, para todas las
operaciones de Apoyo de Combate y Apoyo de Servicio de Combate.» Garantiza que el Comandante y
el Estado Mayor comprendan, del comando superior, la intención, la misión, las tareas, las
limitaciones, el riesgo, los recursos y el área de operaciones, el concepto de la operación
(incluido el plan de engaño) y la línea de tiempo; y las misiones de las unidades adyacentes
(incluidas las de vanguardia y retaguardia) y su relación con el plan del comando superior.

CÓMO SE ARMA (hoja de trabajo del PMTD, pág. 20):
1.- Tarea y Propósito del Comando dos escalones más arriba.
2.- Tarea y Propósito del Comando inmediato superior.
3.- Tarea y Propósito de la Unidad propia.
4.- Las Unidades de maniobra.
5.- Las UU. de apoyo de combate.
6.- Las UU. SPAC.
Cada gráfico lleva la MAGNITUD, la IDENTIFICACIÓN y la DENOMINACIÓN de la unidad.

LA JERARQUÍA — ESCALONES Y MAGNITUDES (no se negocia; es la marca que va sobre cada cuadro):
  CTO — Comando del Teatro de Operaciones .......................... XXXXX   (en el cuadro: «CTO»)
   └─ FF.TT.T.O. — Comando de las Fuerzas Terrestres del T.O. ...... XXXX    (en el cuadro: «FF.TT.T.O.»)
       └─ CE — Cuerpo de Ejército .................................. XXX     (en el cuadro: «CE»)
           └─ DIVISIÓN ............................................. XX      (en el cuadro: el símbolo de su arma)
               └─ Regimiento III · Batallón II · Compañía / Escuadrón / Batería I · Sección •••
                  (las FUERZAS DE TAREA y AGRUPACIONES TÁCTICAS que arma la División van DEBAJO
                   de la División, con la magnitud de su escalón)
- El «TO» / «Teatro de Operaciones» / «CTO» es XXXXX. Las «Fuerzas Terrestres del Teatro de
  Operaciones» NO son el TO: son el FF.TT.T.O., XXXX. Un Cuerpo de Ejército es SIEMPRE XXX (nunca
  XX). Una División es SIEMPRE XX y NUNCA va en la misma fila que sus regimientos.
- Cada escalón depende del inmediato superior; la CADENA DE MANDO se dibuja de arriba hacia abajo,
  una caja por escalón, y DEBAJO de la unidad propia van las unidades que dependen de ella.
- Siglas de la casa: RCB = regimiento de caballería blindado (III) · RIM = regimiento de infantería
  mecanizado (III) · RIAT = regimiento de infantería antitanque (III, maniobra) · RAM = regimiento de
  artillería mecanizado (III) · RAA = regimiento de artillería antiaérea (III) · BATING = batallón de
  ingeniería (II) · BAT. LOG. = batallón logístico (II) · BAT. COM. = batallón de comunicaciones (II)
  · COMP. ICIA. = compañía de inteligencia (I) · Comp. Av. Ejto. = compañía de aviación del Ejército
  (I) · Edrón. = escuadrón (I) · Bat. = batería (I) cuando es de artillería o antiaérea.

SI EL EXPEDIENTE NOMBRA OTRAS DIVISIONES (u otras unidades del MISMO escalón que la unidad propia):
- Son ADYACENTES: dependen del mismo comando superior (el CE) y están a la MISMA altura que la unidad
  propia, NUNCA debajo de ella. Sus regimientos y batallones son de ELLAS: no los mezcles con los de
  la unidad propia.
- Con las opciones «Unidades puras» y «FT / agrupaciones» NO van en la hoja: tenelas en cuenta para
  los propósitos y las relaciones. Con «Mi unidad entre las adyacentes» van en la fila, junto a ella.
- Si la organización de la tarea trae varias divisiones, tomá sólo las unidades de la de la unidad propia.

CÓMO SE ESCRIBE CADA COSA (PMTD 2017, enunciado del curso de acción):
- TAREA de maniobra: presente, tercera persona, tarea táctica + a quién o qué + dónde:
  «Defiende y bloquea al RIMEC-6 entre Co. X y Co. Y», «Retarda y ataca con fuego…».
- PROPÓSITO: empieza con infinitivo: «Evitar que…», «Impedir…», «Proteger…», «Atraer…». El de la
  OD se liga directamente a la misión de la unidad propia; el de cada OC, a la OD.
- Si la operación tiene FASES, la maniobra lleva T y P POR FASE, y en cada fase UNA sola unidad
  de maniobra es el esfuerzo principal ("esfuerzo": true).
- APOYO DE FUEGOS (artillería, morteros, lanzacohetes), por fase: TAREA (destruir, neutralizar,
  suprimir), PROPÓSITO, PAF (a qué unidad da prioridad de apoyo de fuegos) y EFECTO (qué se espera:
  «ocasionar el 30 % de daños…», «impedir el avance…»).
- INGENIERÍA, por fase: PE (prioridad de esfuerzo: movilidad, contramovilidad o supervivencia, y
  cómo) y PT (prioridad de trabajo: a qué unidades, en orden).
- DEFENSA ANTIAÉREA, comunicaciones, inteligencia, aviación y demás apoyo de combate: TAREA, PROPÓSITO
  y PRIORIDAD DE APOYO.
- SPAC (logística, sanidad, etc.): TAREA, PROPÓSITO y PRIORIDAD DE APOYO («operación de
  sostenimiento»).
- Cajas de la cadena de mando: T y P de ESE comando según la orden superior («fuerzas amigas»,
  «misión», «intención»); la de la unidad propia es su misión (reexpresada si está).
- CORTO: es un gráfico. Cada texto, uno a tres renglones (hasta unos 220 caracteres). Sin
  coordenadas salvo que la orden las dé.
- Nombres de unidades, lugares, líneas, áreas y fases EXACTAMENTE como en el expediente. NO
  inventes unidades, cifras, fechas ni lugares: si falta un dato, escribí sólo en ese texto
  «SIN DATO — verificar».
- Terminología de la casa: las operaciones SE EJECUTAN (nunca «se conducen»).
- No escribas «[IA — verificar]»: esta hoja se imprime.

EJEMPLO DEL PMTD (págs. 21-22) — ése es el estilo (ahí la unidad propia es la Div-1):
- CE (XXX) · T: Defiende y derrota al CE. I de ROJO. · P: Proteger VIACHA y Villa BOLÍVAR, evitando
  la captura y conquista de la ciudad de LA PAZ y ejecutar operaciones favorables para iniciar una
  contraofensiva por el Sub Teatro Norte del TO con ROJO.
- Div-1 (XX, unidad propia) · T: Defiende y destruye al RIMEC 6 y a la FT-43. · P: Evitar la ejecución
  de operaciones coordinadas de la DIMEC-3 y DIMEC-5 de ROJO destinadas a la conquista de VIACHA.
- INGAVI (III, OC2) · T F1: Se desplaza por el ITIN. 1, ocupa posiciones al Oeste de PAMPA
  POSTIRI. P: Realizar la posición defensiva en dicho sector. · T F2 (esfuerzo principal): Ataca y
  destruye al RIMEC-6. P: Evitar que esta unidad conquiste las elevaciones en Coord. 8100-4100,
  obligando el desplazamiento de la FT-43.
- CALAMA (III, OD ☆) · T F4 (esfuerzo principal): Ataca y destruye a las unidades de la FT-43 en el
  AE «YUNQUE». P: Impedir la ejecución del cerco a VIACHA y su posterior conquista por parte de la DIMEC-5.
- B. ING. (II) · FASE I — PE: Contramovilidad mediante la instalación de fajas de minas. PT: OC1 y OC2.
- RA-1 (III) · FASE IV — TAREA: Destruir a la FT-43 en el AE YUNQUE. PROPÓSITO: Evitar que el enemigo
  prosiga hasta cercar VIACHA. PAF: OD. EFECTO: Ocasionar daños de 30 % en los sistemas de armas del enemigo.
- Relaciones del ejemplo: Div-1 → CE (directa); CALAMA (OD) → Div-1 (directa); INGAVI (OC2) → Div-1
  (directa); LANZA (OC1) → CALAMA (directa); TOLEDO (OC3) → CALAMA (directa); LANZA → INGAVI
  (indirecta: la apoya con fuego en la fase II); B. ING. → CALAMA (directa) y → INGAVI, LANZA,
  TOLEDO (indirecta); RA-1 → CALAMA (directa: PAF a la OD) y → LANZA, TOLEDO (indirecta).

RELACIONES DIRECTAS E INDIRECTAS — CÓMO SE IDENTIFICAN (flecha LLENA = directa · DISCONTINUA = indirecta).
Cada relación va «desde» la unidad cuya tarea SOSTIENE «hasta» la unidad cuyo propósito sostiene.
Es DIRECTA cuando el cumplimiento de la tarea de una es CONDICIÓN INMEDIATA del propósito de la otra:
  · cada escalón de la cadena de mando con su inmediato superior (DIVISIÓN → CE → FF.TT.T.O. → CTO);
  · la OD con la unidad propia (el propósito de la OD es el de la unidad propia);
  · la OC cuyo efecto crea la condición que la OD necesita (fija, canaliza, desgasta, bloquea o
    desorganiza al enemigo para que la OD lo destruya) → a la OD; la OC que cumple por sí una parte
    de la misión de la unidad propia → a la unidad propia;
  · el apoyo de combate y el SPAC con la unidad a la que dan la PRIORIDAD (PAF de los fuegos, PT de la
    ingeniería, prioridad de apoyo) → a esa unidad.
Es INDIRECTA cuando contribuye, pero no de inmediato o a través de otra:
  · una OC que crea condiciones para OTRA OC (no para la OD);
  · la reserva respecto de la OD o de la unidad cuya misión puede asumir; «sigue y apoya» / «sigue y
    asume» respecto de la unidad a la que sigue;
  · el apoyo de combate o SPAC a las unidades que NO tienen la prioridad (apoyo general);
  · una unidad «BAJO CONTROL» respecto de las que apoya sin prioridad.
Toda unidad de las filas tiene AL MENOS una relación. Las flechas van de la que sostiene a la sostenida
(de la subordinada hacia arriba, de la que apoya hacia la apoyada), nunca de la unidad propia a sus
subordinadas, y nunca con unidades de otra división.`

const NIVEL = {
  puras: (p) => `OPCIÓN QUE ELIGIÓ EL OFICIAL: «${ENFOQUES.puras.nom}».
- "superior" = la CADENA DE MANDO, una caja por escalón, de arriba hacia abajo, TERMINANDO en la
  UNIDAD PROPIA${p ? ` (${p})` : ''}, con "propia": true (la última caja). Para una División:
  CTO (XXXXX) → FF.TT.T.O. (XXXX) → CE (XXX) → la División (XX).
- "maniobra", "apoyo" y "spac" = las unidades que dependen DIRECTAMENTE de la unidad propia, tal como
  están en la ORGANIZACIÓN DE LA TAREA de la orden: CADA COLUMNA (o encabezado) del cuadro es UNA
  unidad (regimiento, batallón o compañía) y va con su designación y su nombre («RCB-1 «…»»); lo que
  figura debajo de cada una (escuadrones, compañías, baterías, secciones: «Edrón. Tq. “A”», «Comp.
  Inf. Mec. “B”», «Bat. C y S.») son SUS subunidades y NO se dibujan. Las de la columna «BAJO
  CONTROL» también van, con "mando": "BAJO CONTROL".
  · maniobra: infantería, infantería mecanizada (RIM), caballería (RCB, RCM), blindados, infantería
    antitanque (RIAT);
  · apoyo: artillería (RA, RAM), antiaérea (RAA), ingeniería (BATING), comunicaciones (BAT. COM.),
    inteligencia (COMP. ICIA.), aviación del Ejército (Comp. Av. Ejto.);
  · spac: logística (BAT. LOG.), sanidad, transporte, mantenimiento.
- Cada una con su rol en la operación si lo tiene (OD, OC1, OC2…, RES) y su tarea y propósito POR
  FASE, según el concepto de la operación y las tareas a las unidades de la orden.`,
  ft: (p) => `OPCIÓN QUE ELIGIÓ EL OFICIAL: «${ENFOQUES.ft.nom}».
- "superior" = la misma CADENA DE MANDO, una caja por escalón, de arriba hacia abajo, TERMINANDO en
  la UNIDAD PROPIA${p ? ` (${p})` : ''}, con "propia": true (la última caja). Las FT y agrupaciones
  van DEBAJO de ella.
- "maniobra" = las FUERZAS DE TAREA y AGRUPACIONES TÁCTICAS que ARMÓ EL OFICIAL (más abajo, en «LO QUE
  YA IDENTIFICÓ LA MESA», con su nombre, escalón, rol, tarea táctica, propósito y composición). Usá
  EXACTAMENTE esos nombres y esos roles (OD, OC1, OC2…, RES); no inventes otras ni las renombres. Su
  tarea y su propósito, POR FASE, coherentes con su composición y con la tarea táctica que les puso el
  oficial (mejorá la redacción, no el sentido).
- La agrupación de SOSTENIMIENTO (SOST) va en "spac".
- Las unidades orgánicas que NO entraron en ninguna FT, o que dieron sólo parte de sus elementos
  («(-)»), siguen dependiendo de la unidad propia: van en su fila (casi siempre apoyo de combate o
  SPAC), con lo suyo.`,
  adyacentes: (p, s) => `OPCIÓN QUE ELIGIÓ EL OFICIAL: «${ENFOQUES.adyacentes.nom}» (análisis de la orden superior).
- "superior" = la CADENA DE MANDO hasta el comando INMEDIATO SUPERIOR de la unidad propia${s ? ` (${s})` : ''},
  de arriba hacia abajo (para una División: CTO XXXXX → FF.TT.T.O. XXXX → CE XXX). La unidad
  propia NO va en la cadena.
- "maniobra" = la UNIDAD PROPIA${p ? ` (${p})` : ''} ("propia": true) y las unidades del MISMO ESCALÓN que
  manda ese comando superior (las otras divisiones del CE), incluidas las de vanguardia y
  retaguardia, con su rol y su tarea y propósito según la orden superior (por fase si tiene fases).
- "apoyo" y "spac" = el apoyo de combate y de servicio de combate DEL ESCALÓN SUPERIOR (tropas del
  CE), con su relación con las unidades de la fila.`,
}

const ESQUEMA_JSON = `{
  "fases": [ { "id": "F1", "nombre": "…" } ],
  "unidades": [
    { "id": "…", "grupo": "superior", "escalon": "teatro", "nombre": "…", "magnitud": "XXXXX", "texto": "CTO", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "superior", "escalon": "fftt", "nombre": "…", "magnitud": "XXXX", "texto": "FF.TT.T.O.", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "superior", "escalon": "cuerpo", "nombre": "…", "magnitud": "XXX", "texto": "CE", "numero": "I", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "superior", "escalon": "division", "propia": true, "nombre": "…", "magnitud": "XX", "arma": "mecanizada", "numero": "1", "tarea": "…", "proposito": "…" },
    { "id": "…", "grupo": "maniobra", "nombre": "…", "magnitud": "III", "arma": "cabmec", "rol": "OD",
      "fases": [ { "fase": "F1", "tarea": "…", "proposito": "…", "esfuerzo": false } ] },
    { "id": "…", "grupo": "apoyo", "nombre": "…", "magnitud": "III", "arma": "artilleria",
      "fases": [ { "fase": "F1", "tarea": "…", "proposito": "…", "paf": "OD", "efecto": "…" } ] },
    { "id": "…", "grupo": "apoyo", "nombre": "…", "magnitud": "II", "arma": "ingenieria",
      "fases": [ { "fase": "F1", "pe": "…", "pt": "…" } ] },
    { "id": "…", "grupo": "apoyo", "nombre": "…", "magnitud": "I", "arma": "aviacion", "mando": "BAJO CONTROL", "tarea": "…", "proposito": "…", "prioridad": "…" },
    { "id": "…", "grupo": "spac", "nombre": "…", "magnitud": "II", "arma": "logistica", "tarea": "…", "proposito": "…", "prioridad": "…" }
  ],
  "relaciones": [ { "desde": "<id>", "hasta": "<id>", "tipo": "directa" } ]
}`

function hojaParaPedido(v) {
  const sinVacios = (o) => Object.fromEntries(Object.entries(o).filter(([k, x]) => !['origen'].includes(k) && x !== '' && x !== false && !(Array.isArray(x) && !x.length)))
  return JSON.stringify(
    {
      fases: v.fases,
      unidades: v.unidades.map((u) => sinVacios({ ...u, escalon: u.grupo === 'superior' ? escalonDeUnidad(u) : '', fases: u.fases.map(sinVacios) })),
      relaciones: v.relaciones,
    },
    null,
    1,
  )
}

// Lo que la Mesa ya sabe del ejercicio, dicho para que la IA lo verifique.
function lecturaParaPedido(ctx, enfoque) {
  let l
  try {
    l = lecturaDelEjercicio(ctx || {}, enfoque)
  } catch {
    return ''
  }
  const mag = (u) => [u.magnitud, u.rol, u.mando].filter(Boolean).join(', ')
  const partes = []
  const p = l.propia
  partes.push(p.nombre ? `- Unidad propia: ${p.nombre} (${ESCALON[p.escalon]?.mag || ''}, ${ESCALON[p.escalon]?.nom || ''}) — salió de: ${p.fuente}.` : '- Unidad propia: la Mesa NO tiene su denominación. Sacala del expediente (el OBJETO o la MISIÓN de la orden); si no está, «SIN DATO — verificar». Por defecto es una División (XX).')
  if (l.cadena.length) partes.push(`- Cadena de mando por encima de la unidad propia (de arriba hacia abajo): ${l.cadena.map((c) => `${c.nombre} (${c.magnitud}${c.texto ? `, «${c.texto}»` : ''})`).join(' → ')}${enfoque === 'adyacentes' ? '' : ` → ${p.nombre || 'la unidad propia'} (${ESCALON[p.escalon]?.mag || ''})`}. Los nombres genéricos («Comando del Teatro de Operaciones»…) cambialos por los del expediente si los trae.`)
  if (enfoque === 'puras') {
    if (l.subordinadas.length) partes.push(`- Unidades que dependen DIRECTAMENTE de la unidad propia (${l.fuentes.join('; ') || 'ejercicio'}): ${l.subordinadas.map((u) => `${u.nombre} (${[u.magnitud, u.grupo, u.mando].filter(Boolean).join(', ')})`).join(' · ')}. Verificalas contra la organización de la tarea del expediente: van TODAS y sólo ellas.`)
    else partes.push('- La Mesa no encontró la organización de la tarea: sacá del expediente las unidades que dependen directamente de la unidad propia.')
  }
  if (enfoque === 'ft') {
    if (l.fts.length)
      partes.push(
        `- FT / agrupaciones que ARMÓ EL OFICIAL (van TODAS, con este nombre y este rol):\n${l.fts
          .map((f) => `    · ${f.nombre} — ${[f.magnitud, f.rol || 'sin rol', f.clase === 'pura' ? 'unidad pura' : f.clase === 'ft' ? 'fuerza de tarea' : 'agrupación táctica'].join(', ')}${f.tarea ? ` · tarea táctica: ${f.tarea}` : ''}${f.proposito ? ` · propósito: «${f.proposito}»` : ''}${f.composicion.length ? ` · composición: ${f.composicion.join(', ')}` : ''}`)
          .join('\n')}`,
      )
    else partes.push('- El oficial todavía NO armó FT ni agrupaciones en la Mesa: usá las del expediente si las hay; si no, las unidades orgánicas.')
    const quedan = l.subordinadas.filter((u) => !String(u.origen || '').startsWith('org:'))
    if (quedan.length) partes.push(`- Unidades orgánicas que siguen con su unidad (no entraron en ninguna FT, o «(-)»): ${quedan.map((u) => `${u.nombre} (${mag(u) || u.grupo})`).join(' · ')}.`)
  }
  if (l.adyacentes.length) partes.push(`- Unidades del MISMO escalón que la propia nombradas en la orden (ADYACENTES${enfoque === 'adyacentes' ? ', van en la fila' : ', NO van en esta hoja'}): ${l.adyacentes.map((u) => u.nombre).join(' · ')}.`)
  for (const a of l.avisos) partes.push(`- Ojo: ${a}`)
  return partes.join('\n')
}

// Arma el pedido. Devuelve { ok, prompt } o { ok: false, error }.
export function pedidoIA(valor, { expediente = '', modo = 'completar', ctx = {}, encabezado = '' } = {}) {
  const v = normalizarConceptos(valor)
  const mejorar = modo === 'completar_mejorar'
  const propia = v.unidades.find((u) => u.propia)
  const nomPropia = limpio(ctx?.ordenSup?.unidad || ctx?.unidad || propia?.nombre) || unidadPropiaDelEjercicio(ctx || {}).nombre
  const nomSup = limpio(ctx?.ordenSup?.escalonSuperior)
  const hay = v.unidades.length > 0
  const o = v.orientaciones
  const partes = []
  partes.push(limpio(encabezado) ? encabezado : ENCABEZADO_POR_DEFECTO)
  partes.push('Trabajás en la sección EM. Sec. G-3 (Operaciones).')
  partes.push(`# LA SITUACIÓN — EXPEDIENTE DEL EJERCICIO\n\n${limpio(expediente) ? expediente : '(el expediente no estaba disponible: trabajá con lo que dicen la hoja y las orientaciones del oficial, y marcá «SIN DATO — verificar» lo que no puedas afirmar)'}`)
  partes.push(`---\n\n# LA HOJA\n\nF2·P1 — CONCEPTOS ENTRELAZADOS (hoja de trabajo GRÁFICA del PMTD 2017, pág. 20; ejemplo en las págs. 21-22).\nENTREGA: NO se difunde. Responsable: el Comandante; participa todo el Estado Mayor.\n\n${DOCTRINA}`)
  partes.push(`---\n\n# ${NIVEL[v.enfoque](nomPropia, nomSup)}`)
  const lectura = lecturaParaPedido(ctx, v.enfoque)
  if (lectura) partes.push(`---\n\n# LO QUE YA IDENTIFICÓ LA MESA (verificalo contra el expediente; si el expediente dice otra cosa, manda el expediente)\n\n${lectura}`)
  const orient = []
  if (limpio(o.info)) orient.push(`INFORMACIÓN ADICIONAL QUE CARGÓ EL OFICIAL:\n${String(o.info).trim()}`)
  for (const a of o.adjuntos) if (limpio(a.texto)) orient.push(`DOCUMENTO ADJUNTADO A ESTA HOJA — «${a.nombre}»:\n${String(a.texto).trim()}`)
  if (orient.length) partes.push(`---\n\n# ORIENTACIONES E INFORMACIÓN PARA ESTA HOJA\n\nLo cargó el oficial para ESTA hoja. Es tan fuente como el expediente; si lo contradice, manda lo que cargó el oficial.\n\n${orient.join('\n\n')}`)
  const ant = antecedentesConceptos(v)
  if (ant.length) partes.push(`---\n\n# LO QUE SE ESCRIBIÓ ANTES EN ESTA HOJA (formato narrativo viejo)\n\nUsalo como fuente, pero la hoja ahora es GRÁFICA: pasalo a unidades con tarea y propósito.\n\n${ant.map(([k, t]) => `- ${k}: ${limpio(t)}`).join('\n')}`)
  const tarea = !hay
    ? `TAREA — ARMAR LA HOJA COMPLETA.\n\nLa hoja está vacía. Armala ENTERA para esta situación y con la opción elegida: la cadena de mando, las filas de maniobra, apoyo de combate y SPAC, las fases y las relaciones. Ninguna unidad sin tarea y propósito.`
    : mejorar
      ? `TAREA — COMPLETAR **Y** MEJORAR LA HOJA, HASTA DEJARLA COMPLETA.\n\nDevolvé la hoja ENTERA. Lo que está escrito, reescribilo como producto de Estado Mayor (tarea táctica + a quién/qué + dónde; propósito ligado al de arriba) sin perder ningún dato verificable; lo que falta, completalo: escalones de la cadena de mando, unidades de maniobra, de apoyo y SPAC que estén en el expediente y no en la hoja, sus fases, sus textos y las relaciones. Si una unidad está en un lugar que no le corresponde por su escalón, ponela donde va. Conservá el "id" de cada unidad que ya existe.`
      : `TAREA — COMPLETAR LA HOJA.\n\nNo cambies lo que ya está escrito: eso lo puso el oficial o salió del calco. Devolvé la hoja ENTERA, con lo existente tal cual y lo que falte COMPLETADO: textos vacíos, escalones de la cadena de mando, unidades del expediente que faltan (maniobra, apoyo de combate, SPAC), fases y relaciones. Conservá el "id" de cada unidad que ya existe; a las nuevas poneles un "id" nuevo corto ("n1", "n2"…).`
  partes.push(`---\n\n# ${tarea}\n\nLO QUE HAY HOY EN LA HOJA (JSON):\n\`\`\`json\n${hojaParaPedido(v)}\n\`\`\``)
  const armas = Object.entries(ARMAS).map(([k, a]) => `${k} (${a.nom})`).join(', ')
  partes.push(
    `---\n\n# CÓMO CONTESTAR\n\nRespondé ÚNICAMENTE con este JSON y nada más:\n\n\`\`\`json\n${ESQUEMA_JSON}\n\`\`\`\n\nValores permitidos:\n- "grupo": superior | maniobra | apoyo | spac. "superior" es la cadena de mando: una unidad por escalón, de arriba hacia abajo.\n- "escalon" (en la cadena de mando): teatro (CTO, XXXXX) | fftt (FF.TT.T.O., XXXX) | cuerpo (CE, XXX) | division (XX) | brigada (X) | regimiento (III) | batallon (II).\n- "magnitud": XXXXX, XXXX, XXX, XX, X, III, II, I, ••• — la que corresponde a su escalón (ver LA JERARQUÍA).\n- "arma": ${armas}. Vacío ("") para un comando que se identifica con texto ("texto": "CTO", "FF.TT.T.O.", "CE").\n- "propia": true en UNA sola unidad: la unidad propia.\n- "rol" (sólo maniobra): OD, OC1, OC2, OC3, OC4, RES. Una sola OD.\n- "mando" (opcional): "BAJO CONTROL" para las unidades que no son orgánicas y se le dan bajo control.\n- "fase": el "id" de una de las "fases" ("F1", "F2"…). Si la operación no tiene fases, usá "tarea" y "proposito" de la unidad, sin "fases".\n- "relaciones": "desde" y "hasta" son "id" de unidades de la hoja; "tipo": directa | indirecta (ver RELACIONES DIRECTAS E INDIRECTAS).\n- "rotulo": el nombre corto que va junto al gráfico (ej.: "LANZA", "RA-1"); "numero": el número que va al pie del gráfico (ej.: "1").\nTiene que poder leerse con JSON.parse: sin comentarios y sin texto alrededor.`,
  )
  const propiaAca = v.enfoque === 'adyacentes' ? 'en la fila de maniobra, junto a las adyacentes' : 'la ÚLTIMA caja de la cadena de mando ("superior")'
  partes.push(
    `---\n\n# ANTES DE CONTESTAR, VERIFICÁ (y corregí lo que no cumpla)\n\n1. Magnitudes: CTO XXXXX · FF.TT.T.O. XXXX · CE XXX · División XX · Regimiento III · Batallón II · Compañía / Escuadrón / Batería I. Ningún CE con XX; ningunas «Fuerzas Terrestres» como «TO».\n2. La unidad propia está UNA vez, con "propia": true, y es ${propiaAca}.\n3. ${v.enfoque === 'adyacentes' ? 'En la fila de maniobra sólo hay unidades del mismo escalón que la propia; los escalones más altos van en la cadena.' : 'En las filas NO hay ninguna unidad del mismo escalón que la propia ni más alta (ninguna División, CE, FF.TT.T.O. ni CTO): sólo las que dependen de ella. Otras divisiones son ADYACENTES y no van.'}\n4. ${v.enfoque === 'puras' ? 'Están TODAS las unidades de la organización de la tarea de la unidad propia (una por columna del cuadro, también las BAJO CONTROL) y ninguna subunidad suelta.' : v.enfoque === 'ft' ? 'Están TODAS las FT / agrupaciones que armó el oficial, con su nombre y su rol exactos, y las unidades orgánicas que quedaron fuera de ellas.' : 'Están todas las unidades del mismo escalón que nombra la orden superior.'}\n5. Una sola OD; un solo esfuerzo principal por fase.\n6. Cada unidad de las filas tiene tarea y propósito (por fase, si hay fases) y AL MENOS una relación; cada escalón de la cadena, la suya con el inmediato superior.\n7. Todos los "desde" / "hasta" son "id" de unidades de la hoja.`,
  )
  return { ok: true, prompt: partes.join('\n\n'), modo: mejorar ? 'completar_mejorar' : 'completar' }
}

// La idea del oficial va AL FINAL del pedido, donde más pesa (como en las demás hojas).
export function conIndicacion(prompt, idea) {
  const n = String(idea || '').trim()
  return n
    ? `${prompt}\n\n# IDEA E INDICACIÓN DEL OFICIAL QUE PLANIFICA\n\nEsto lo escribió él para ESTE pedido, y es lo último que leés antes de contestar.\nTiene prioridad sobre cualquier criterio propio tuyo. Si contradice algo de la\ndoctrina citada arriba, cumplilo igual y avisá en UNA línea cuál es el reparo\n(fuera del JSON, al final).\n\n${n}`
    : prompt
}

// ─── Lectura de la respuesta ─────────────────────────────────────────────────────
function sacarJSON(texto) {
  const t = String(texto || '')
  const cands = []
  for (const m of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) cands.push(m[1])
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a >= 0 && b > a) cands.push(t.slice(a, b + 1))
  for (const c of cands) {
    try {
      const j = JSON.parse(c)
      if (j && typeof j === 'object') return j
    } catch {}
  }
  return null
}
const GRUPO_SINONIMOS = {
  superior: 'superior', superior2: 'superior', superior1: 'superior', cadena: 'superior', cadena_de_mando: 'superior', mando: 'superior', comando: 'superior', comando_superior: 'superior', dos_arriba: 'superior', dosescalones: 'superior', propia: 'superior', unidad_propia: 'superior',
  maniobra: 'maniobra', adyacentes: 'maniobra', apoyo: 'apoyo', apoyo_combate: 'apoyo', apoyo_de_combate: 'apoyo', apoyodecombate: 'apoyo', ac: 'apoyo',
  spac: 'spac', apoyo_servicio: 'spac', apoyo_de_servicio_de_combate: 'spac', servicios: 'spac', asc: 'spac', sost: 'spac',
}
const MAGNITUD_PALABRA = { teatro: 'XXXXX', fftt: 'XXXX', ejercito: 'XXXX', cuerpo: 'XXX', division: 'XX', brigada: 'X', regimiento: 'III', batallon: 'II', compania: 'I', escuadron: 'I', bateria: 'I', seccion: '•••' }
function normMagnitud(m) {
  const t = limpio(m).toUpperCase().replace(/\s+/g, '')
  if (!t) return ''
  if (/^(X{1,5}|I{1,3}|•{2,3}|\.{2,3})$/.test(t)) return t.replace(/\./g, '•')
  const w = sinTildes(m).toLowerCase()
  for (const [k, v] of Object.entries(MAGNITUD_PALABRA)) if (w.includes(k)) return v
  return t.slice(0, 6)
}
function normArma(a) {
  const t = sinTildes(a).toLowerCase().trim()
  if (!t) return ''
  if (ARMAS[t]) return t
  if (/antiaer|daa|\bada\b/.test(t)) return 'antiaerea'
  if (/antitanq/.test(t)) return 'antitanque'
  if (/cab/.test(t)) return /mec|blind/.test(t) ? 'cabmec' : 'caballeria'
  if (/mec/.test(t)) return 'mecanizada'
  if (/motor/.test(t)) return 'motorizada'
  if (/blind|tanq|acoraz/.test(t)) return 'blindada'
  if (/montan|andin/.test(t)) return 'andina'
  if (/selva/.test(t)) return 'selva'
  if (/paracaid|aerotransp/.test(t)) return 'aerotransportada'
  if (/recon/.test(t)) return 'reconocimiento'
  if (/lanzacoh|cohete/.test(t)) return 'lanzacohetes'
  if (/mortero/.test(t)) return 'morteros'
  if (/artill/.test(t)) return 'artilleria'
  if (/ingen/.test(t)) return 'ingenieria'
  if (/comunic|transmis|telecom/.test(t)) return 'comunicaciones'
  if (/intelig/.test(t)) return 'inteligencia'
  if (/aviac|helic/.test(t)) return 'aviacion'
  if (/logist/.test(t)) return 'logistica'
  if (/intend/.test(t)) return 'intendencia'
  if (/material/.test(t)) return 'materialbelico'
  if (/sanid/.test(t)) return 'sanidad'
  if (/transp/.test(t)) return 'transporte'
  if (/manten/.test(t)) return 'mantenimiento'
  if (/veter/.test(t)) return 'veterinaria'
  if (/polic/.test(t)) return 'policiamilitar'
  if (/infan/.test(t)) return 'infanteria'
  return ''
}
function normRol(r) {
  const t = sinTildes(r).toUpperCase().replace(/[\s.\-]+/g, '')
  if (!t) return ''
  if (t.startsWith('OD') || t.includes('DECISIVA')) return 'OD'
  const m = t.match(/^OC(\d)/)
  if (m) return `OC${m[1]}`
  if (t.startsWith('RES')) return 'RES'
  if (t.startsWith('SOST')) return 'SOST'
  return t.slice(0, 6)
}
const verdad = (x) => x === true || /^(s[ií]|true|1|x)$/i.test(String(x ?? '').trim())
const ESCALON_IA = { teatro: 'teatro', cto: 'teatro', to: 'teatro', fftt: 'fftt', ffttto: 'fftt', ejercito: 'fftt', cuerpo: 'cuerpo', ce: 'cuerpo', division: 'division', div: 'division', brigada: 'brigada', regimiento: 'regimiento', batallon: 'batallon', compania: 'compania' }
const nivel = (u) => ESCALON[escalonDeUnidad(u) === 'ejercito' ? 'fftt' : escalonDeUnidad(u)]?.nivel ?? -1

// Aplica la respuesta. modo 'completar': sólo llena lo vacío y agrega lo que falta;
// 'completar_mejorar': reescribe con lo que trae la IA (lo que no trae, se conserva).
// En los dos, al final cada unidad queda en su escalón (acomodarJerarquia) y se avisa
// qué se corrigió. `ctx` (el del ejercicio) da el nombre de la unidad propia.
export function aplicarRespuestaIA(valor, texto, { modo = 'completar', corregir = null, ctx = null } = {}) {
  let j = sacarJSON(texto)
  if (!j) return { ok: false, error: 'No se encontró un JSON válido en lo que pegaste. Pedile a la IA que reenvíe SÓLO el bloque JSON.' }
  if (typeof corregir === 'function') {
    try {
      j = corregir(j)
    } catch {}
  }
  const lista = Array.isArray(j) ? j : Array.isArray(j.unidades) ? j.unidades : null
  if (!lista || !lista.length) return { ok: false, error: 'La respuesta no trae "unidades": la IA tenía que devolver la hoja con { "fases", "unidades", "relaciones" }.' }
  const v = normalizarConceptos(valor)
  const pisar = modo === 'completar_mejorar'
  const unidades = v.unidades.map((u) => ({ ...u, fases: u.fases.map((f) => ({ ...f })) }))
  let fases = v.fases.map((f) => ({ ...f }))
  let n = 0
  let nuevas = 0
  let sinDato = 0
  const cuenta = (s) => {
    n++
    if (/SIN DATO/i.test(s)) sinDato++
  }
  // Fases
  const idFase = {}
  const fasesIA = (Array.isArray(j.fases) ? j.fases : []).filter((f) => f && typeof f === 'object')
  fasesIA.forEach((f, i) => {
    const id = limpio(f.id) || `F${i + 1}`
    const nombre = limpio(f.nombre)
    let e = fases.find((x) => x.id === id) || (nombre && fases.find((x) => clave(x.nombre) === clave(nombre)))
    if (!e) {
      e = { id: fases.some((x) => x.id === id) ? `F${fases.length + 1}` : id, nombre: '' }
      fases.push(e)
    }
    if (nombre && (!e.nombre || pisar)) e.nombre = nombre
    idFase[id] = e.id
  })
  const faseDe = (f, i) => {
    const bruto = limpio(f?.fase ?? f?.id ?? '')
    if (idFase[bruto]) return idFase[bruto]
    if (fases.some((x) => x.id === bruto)) return bruto
    const rom = sinTildes(bruto).toUpperCase().replace(/^FASE\s*/, '')
    const nums = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 }
    const k = nums[rom] || Number(rom.replace(/^F/, '')) || i + 1
    const id = `F${k}`
    if (!fases.some((x) => x.id === id)) fases.push({ id, nombre: '' })
    return id
  }
  // Unidades
  const mapa = {}
  for (const [i, x] of lista.entries()) {
    if (!x || typeof x !== 'object') continue
    const grupo = GRUPO_SINONIMOS[sinTildes(x.grupo).toLowerCase().replace(/[\s-]+/g, '_')] || (x.propia ? 'superior' : 'maniobra')
    const idIA = limpio(x.id) || `ia${i + 1}`
    const nombre = limpio(x.nombre)
    // El escalón que declara la IA para una caja de la cadena («fftt», «cuerpo»…).
    const escIA = ESCALON_IA[sinTildes(x.escalon).toLowerCase().replace(/[^a-z]/g, '')] || ''
    const provisoria = { nombre, texto: limpio(x.texto), magnitud: escIA ? magnitudDeEscalon(escIA) : normMagnitud(x.magnitud) }
    const nIA = nivel(provisoria)
    let e =
      unidades.find((u) => u.id === idIA) ||
      (x.propia && verdad(x.propia) && unidades.find((u) => u.propia)) ||
      (nombre && unidades.find((u) => mismaUnidad(u.nombre, nombre) || (u.rotulo && clave(u.rotulo) === clave(nombre)))) ||
      (grupo === 'superior' && nIA >= 0 && unidades.find((u) => u.grupo === 'superior' && !u.propia && nivel(u) === nIA))
    if (!e) {
      e = { id: unidades.some((u) => u.id === idIA) ? nuevoId('u') : idIA, grupo, nombre: '', rotulo: '', magnitud: '', arma: '', texto: '', numero: '', rol: '', mando: '', propia: false, esfuerzo: false, fases: [] }
      for (const k of TEXTOS) e[k] = ''
      unidades.push(e)
      nuevas++
    }
    mapa[idIA] = e.id
    if (x.id != null) mapa[limpio(x.id)] = e.id
    // Hay IA que en las relaciones pone el nombre o el rótulo en vez del id.
    for (const k of [nombre, limpio(x.rotulo)]) if (k && !mapa[k]) mapa[k] = e.id
    const poner = (k, val) => {
      if (!val) return
      if (!limpio(e[k]) || pisar) {
        if (e[k] !== val) {
          e[k] = val
          if (TEXTOS.includes(k)) cuenta(val)
        }
      }
    }
    if (pisar && grupo !== e.grupo && !e.propia) e.grupo = grupo
    poner('nombre', nombre.slice(0, 90))
    poner('rotulo', limpio(x.rotulo).slice(0, 30))
    poner('magnitud', provisoria.magnitud)
    poner('arma', normArma(x.arma))
    poner('texto', limpio(x.texto).slice(0, 12))
    poner('numero', limpio(x.numero).slice(0, 8))
    poner('mando', limpio(x.mando).toUpperCase().slice(0, 30))
    if (e.grupo === 'maniobra') poner('rol', normRol(x.rol))
    if (verdad(x.propia) && !unidades.some((u) => u !== e && u.propia)) e.propia = true
    if (x.esfuerzo != null && (pisar || !e.esfuerzo)) e.esfuerzo = verdad(x.esfuerzo)
    for (const k of TEXTOS) poner(k, limpio(x[k]))
    for (const [jf, f] of (Array.isArray(x.fases) ? x.fases : []).entries()) {
      if (!f || typeof f !== 'object') continue
      const id = faseDe(f, jf)
      let ef = e.fases.find((y) => y.fase === id)
      if (!ef) {
        ef = { fase: id, esfuerzo: false }
        for (const k of TEXTOS) ef[k] = ''
        e.fases.push(ef)
      }
      for (const k of TEXTOS) {
        const val = limpio(f[k])
        if (val && (!limpio(ef[k]) || pisar) && ef[k] !== val) {
          ef[k] = val
          cuenta(val)
        }
      }
      if (f.esfuerzo != null && (pisar || !ef.esfuerzo)) ef.esfuerzo = verdad(f.esfuerzo)
    }
  }
  // Relaciones: en «completar» se agregan; en «completar y mejorar» mandan las de la IA.
  const resolver = (x) => {
    const k = limpio(x)
    if (mapa[k]) return mapa[k]
    if (unidades.some((u) => u.id === k)) return k
    const u = unidades.find((u) => mismaUnidad(u.nombre, k) || (u.rotulo && clave(u.rotulo) === clave(k)))
    return u ? u.id : k
  }
  const relIA = (Array.isArray(j.relaciones) ? j.relaciones : [])
    .filter((r) => r && typeof r === 'object')
    .map((r) => ({ desde: resolver(r.desde), hasta: resolver(r.hasta), tipo: /indirect/i.test(r.tipo) ? 'indirecta' : 'directa' }))
    .filter((r) => r.desde !== r.hasta && unidades.some((u) => u.id === r.desde) && unidades.some((u) => u.id === r.hasta))
  let relaciones = pisar && relIA.length ? [] : [...v.relaciones]
  let nRel = 0
  for (const r of relIA) {
    const ya = relaciones.find((x) => x.desde === r.desde && x.hasta === r.hasta)
    if (ya) {
      if (pisar) ya.tipo = r.tipo
      continue
    }
    relaciones.push(r)
    nRel++
  }
  // Una sola OD y un solo esfuerzo principal por fase: si la IA puso dos, queda el primero.
  const ods = unidades.filter((u) => u.grupo === 'maniobra' && u.rol === 'OD')
  for (const u of ods.slice(1)) u.rol = ''
  for (const f of fases) {
    const ep = unidades.filter((u) => u.grupo === 'maniobra').flatMap((u) => u.fases.filter((x) => x.fase === f.id && x.esfuerzo))
    for (const x of ep.slice(1)) x.esfuerzo = false
  }
  fases = fases.filter((f, i, a) => a.findIndex((y) => y.id === f.id) === i)
  if (!n && !nuevas && !nRel) return { ok: false, error: pisar ? 'La respuesta no traía nada distinto de lo que ya está en la hoja.' : 'La respuesta no traía nada para completar: todo lo que vino ya estaba escrito. Si querés que REESCRIBA, elegí «Completar y mejorar».' }
  // Cada unidad en su escalón, aunque la IA la haya puesto en otro lado.
  const nomPropia = ctx ? unidadPropiaDelEjercicio(ctx).nombre : ''
  const { valor: acomodada, cambios } = acomodarJerarquia({ ...v, fases, unidades, relaciones, ia: { fecha: new Date().toISOString(), modo } }, { propia: nomPropia })
  const msg = [`Listo: ${n} texto(s) ${pisar ? 'escritos' : 'completados'}`, nuevas ? `${nuevas} unidad(es) nueva(s)` : '', nRel ? `${nRel} relación(es)` : ''].filter(Boolean).join(', ')
  return {
    ok: true,
    valor: acomodada,
    n,
    nuevas,
    relaciones: nRel,
    pendientes: sinDato,
    corregido: cambios,
    msg: `${msg}. ${cambios.length ? `La Mesa acomodó ${cambios.length === 1 ? 'una unidad' : `${cambios.length} cosas`} que la IA puso fuera de su escalón: ${cambios.join(' ')} ` : ''}${sinDato ? `${sinDato === 1 ? 'Uno quedó' : `${sinDato} quedaron`} como «SIN DATO — verificar»: eso es lo que hay que ir a buscar. ` : ''}Mirá la hoja y revisala antes de darla por buena: es una propuesta, no una fuente.`,
  }
}

export { GRUPOS, CAMPOS, tipoUnidad, nombreUnidad, escalonDeNombre }
