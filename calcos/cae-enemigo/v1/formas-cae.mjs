// H.T. 17 · Elegir qué forma de acción es el CAE-1 y cuál el CAE-2 — 10-11-2026.
//
// Sergio, con las formas de acción de la H.T. 17 en pantalla: «permite seleccionar 2 opciones, 1
// para que sobre eso se vaya armando el CAE 1, otra para que se arme el CAE 2. Y así se pueda llenar
// automáticamente» la evaluación (CONVENIENCIA, APLICABILIDAD, RIESGO, CONSISTENCIA CON LA DOCTRINA).
//
// Cada forma tiene ahora dos botones, «CAE-1» y «CAE-2». La forma elegida se acuesta en el calco
// marcada con su CAE (las dos quedan juntas, una sobre otra) y su columna de la tabla se llena con
// la evaluación doctrinal de esa forma, nombrando los objetivos de la H.T. 16.
//
// Lo que escribió el alumno no se pisa: se reemplaza una celda sólo si está vacía o si todavía
// tiene el texto que puso este llenado (se recuerda en `_ht17auto`).

export const CAES = ['CAE-1', 'CAE-2']

export const FACTORES = [
  'CONVENIENCIA (si lo ejecuta, ¿cumple sus objetivos?)',
  'APLICABILIDAD (¿es aplicable según la situación y los indicios?)',
  'RIESGO (¿aceptará el enemigo ese riesgo?)',
  'CONSISTENCIA CON LA DOCTRINA (¿está de acuerdo con su doctrina?)',
]

// La clave de la celda en la hoja (tipo «tabla»: la 1.ª columna de datos va sin sufijo).
export const claveCelda = (fila, cae) => (cae === 'CAE-1' ? fila : `${fila}|${cae}`)

// { forma: 'CAE-1' | 'CAE-2' } según las flechas del calco.
export function caeDeManiobra(maniobra = []) {
  const r = {}
  for (const f of maniobra || []) if (f?.forma && CAES.includes(f.cae)) r[f.forma] = f.cae
  return r
}

const lim = (t) => String(t || '').replace(/\s*\[IA\s*[—–-]\s*verificar\]\s*/gi, ' ').replace(/\s+/g, ' ').trim()

function objetivosTexto(objetivos = []) {
  const fin = (objetivos || []).find((o) => o?.clase === 'final')
  const inter = (objetivos || []).filter((o) => o?.clase === 'intermedio')
  const of = fin ? `${fin.etiqueta || 'O1'}${fin.apoyadoEn ? ` (terreno clave ${fin.apoyadoEn})` : ''}` : 'su objetivo final'
  const oi = inter.length ? inter.map((o) => `${o.etiqueta}${o.apoyadoEn ? ` (${o.apoyadoEn})` : ''}`).join(', ') : ''
  return { of, oi, porOi: oi ? `, pasando por ${oi}` : '' }
}

const TEXTOS = {
  frontal: (x) => [
    `Llega a ${x.of} por el camino más corto${x.porOi}. Cumple su objetivo sólo si tiene superioridad para romper de frente; si no, se desgasta contra lo más fuerte de nuestra defensa antes de llegar.`,
    'Aplicable si el frente es estrecho, los flancos están cerrados por terreno severamente restringido o no tiene espacio ni movilidad para maniobrar. Indicios: masa del primer escalón sobre la avenida principal, sin fuerzas hacia los flancos.',
    'Alto en bajas y en tiempo: choca contra nuestras posiciones preparadas. Lo acepta sólo con superioridad aplastante en el punto de ataque (3 a 1 o más) o si el tiempo lo apura.',
    'Poco consistente: «El ataque frontal, por sí solo, es la forma de maniobra MENOS preferida» (RC-02-107, Cap. V, II-A). Lo usa combinado con otra forma, o para fijar.',
  ],
  desbordamiento: (x) => [
    `Fija nuestro frente con una parte y con la otra desborda un flanco hacia ${x.oi || x.of} y ${x.of}: llega a su objetivo evitando lo más fuerte de la defensa. Conveniente.`,
    'Aplicable si hay un flanco abierto o débil y una avenida que lo bordee. Indicios: una fuerza de fijación frente a nuestras posiciones y una agrupación con movilidad que se corre hacia un flanco.',
    'Moderado: si la fuerza de fijación es débil la podemos rechazar y batir el desbordamiento por partes; su flanco de marcha queda expuesto a nuestro contraataque. Es un riesgo que normalmente acepta.',
    'Consistente: el manual la prevé — «se puede usar para FIJAR las defensas mientras otras unidades maniobran para atacar desde el flanco» (RC-02-107, Cap. V, II-A).',
  ],
  envolvimiento: (x) => [
    `La maniobra de flanco va en profundidad y cae sobre nuestra retaguardia hacia ${x.of}: corta los apoyos, el mando y la logística. Muy conveniente: cumple su objetivo y desarticula la defensa.`,
    'Exige movilidad, un flanco abierto y espacio: un batallón puede envolver a más de 15 km y un regimiento hasta 30 km. Aplicable si el terreno de los flancos es transitable. Indicios: una agrupación fuerte y móvil en un flanco y reconocimientos profundos.',
    'Alto: la fuerza envolvente se separa del resto, alarga sus líneas y expone su propio flanco; puede ser detenida y batida aislada. Lo acepta si tiene superioridad de movilidad y de fuegos.',
    'Consistente: «Si la maniobra de flanco va a mayor profundidad deja de ser desbordamiento y es ENVOLVIMIENTO» (RC-02-107). Es una forma preferida por su doctrina.',
  ],
  doble: (x) => [
    `Envuelve por los DOS flancos y cierra la tenaza sobre ${x.of}: busca cercar y aniquilar nuestra fuerza. Es la que mejor cumple su objetivo si le sale bien.`,
    'Exige superioridad clara y los dos flancos transitables, con espacio para maniobrar. Indicios: agrupaciones móviles en ambos flancos y una fuerza de fijación al centro.',
    'Muy alto: divide sus fuerzas y cada brazo de la tenaza puede ser batido por separado. Lo acepta si nos sabe inferiores y con poca reserva.',
    'Muy consistente: es lo que el manual dice que la fuerza contraria PREFIERE hacer — «si envuelve por los DOS flancos es el DOBLE ENVOLVIMIENTO» (RC-02-107).',
  ],
}

// Los cuatro textos (uno por factor) de una forma.
export function textosForma(forma, { objetivos = [] } = {}) {
  const x = objetivosTexto(objetivos)
  const nom = forma?.nom || forma?.id || 'Forma de acción'
  const base = TEXTOS[forma?.id]
  const cuerpo = base
    ? base(x)
    : [
        `${lim(forma?.resumen) || nom}. Objetivo: ${x.of}.`,
        'Revisá si la situación y los indicios la permiten.',
        'Evaluá qué arriesga el enemigo al ejecutarla.',
        lim(forma?.cita) || 'Contrastala con su doctrina.',
      ]
  return cuerpo.map((t) => `«${nom}» — ${t}`)
}

// Lo que hay que agregarle a los valores del G-2 (t) para que la columna `cae` diga la forma.
export function llenarHT17(valores = {}, cae, forma, ctx = {}) {
  if (!CAES.includes(cae) || !forma) return { cambios: {}, mantenidas: 0 }
  const hoja = { ...(valores.ht17 && typeof valores.ht17 === 'object' ? valores.ht17 : {}) }
  const auto = { ...(valores._ht17auto || {}) }
  const textos = textosForma(forma, ctx)
  let mantenidas = 0
  FACTORES.forEach((fila, i) => {
    const k = claveCelda(fila, cae)
    const actual = typeof hoja[k] === 'string' ? hoja[k] : ''
    if (!actual.trim() || actual === auto[k]) {
      hoja[k] = textos[i]
      auto[k] = textos[i]
    } else mantenidas++
  })
  return { cambios: { ht17: hoja, _ht17auto: auto }, mantenidas }
}

// Al quitar la forma de un CAE: se borra sólo lo que había puesto este llenado.
export function vaciarHT17(valores = {}, cae) {
  if (!CAES.includes(cae)) return { cambios: {} }
  const hoja = { ...(valores.ht17 && typeof valores.ht17 === 'object' ? valores.ht17 : {}) }
  const auto = { ...(valores._ht17auto || {}) }
  for (const fila of FACTORES) {
    const k = claveCelda(fila, cae)
    if (auto[k] && hoja[k] === auto[k]) hoja[k] = ''
    delete auto[k]
  }
  return { cambios: { ht17: hoja, _ht17auto: auto } }
}
