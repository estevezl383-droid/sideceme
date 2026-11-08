// LAS UNIDADES DE MI MANDO — 08-11-2026.
//
// Sergio, con el ejercicio del CE-I a la vista: «las otras unidades no son dependientes del CE,
// por lo tanto no deberían ni aparecer en las opciones». En el calco están también el CTO., las
// FF.TT.TO., los otros cuerpos (CE-II, CE-III, CE-IV)… y la F3·P3 los ofrecía para cumplir las
// tareas y los mandaba a la reserva. Con esto, la hoja sólo trabaja con la unidad propia y lo
// que depende de ella (`dependeDe`, lo que deja ⊞ Disgregar), a cualquier profundidad.
//
// Cuál es la unidad propia: la que nombra la Orden del superior («CE - I» = CE-I); si no la
// nombra o no está en el calco, la única unidad propia que tiene dependientes y no depende de
// nadie. Si no se puede saber (nadie tiene dependientes, o hay varias cabezas), se usan TODAS las
// unidades, como antes: un ejercicio sin disgregar no cambia en nada.
const ENEMIGO = ['enemigo', 'enemigas', 'rojo']
const esUnidad = (u) => !!u && (u.tipo || 'unidad') === 'unidad'
const esPropiaU = (u) => esUnidad(u) && !ENEMIGO.includes(String(u.bando || '').toLowerCase()) && !u.esAgrupacion
const clave = (s) =>
  String(s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '')
const nombreDe = (u) => String(u?.designacion || u?.nombre || '').trim()

// La cabeza puede ser un PC: ⊞ Disgregar deja la unidad madre como `tipo: 'pc'` (el CE-I del
// ejercicio de Sergio). Por eso el árbol se arma con todo lo propio, sea unidad o PC.
const esPropioCualquiera = (u) => !!u && !ENEMIGO.includes(String(u.bando || '').toLowerCase()) && !u.esAgrupacion

export function unidadDelMando(unidades, nombrePropia) {
  const propias = (unidades || []).filter(esPropioCualquiera)
  const hijos = new Map()
  for (const u of propias) {
    const p = u.dependeDe
    if (p == null || p === '') continue
    if (!hijos.has(String(p))) hijos.set(String(p), [])
    hijos.get(String(p)).push(u)
  }
  if (!hijos.size) return null
  const k = clave(nombrePropia)
  let cabeza = k ? propias.find((u) => clave(nombreDe(u)) === k && hijos.has(String(u.id))) : null
  if (!cabeza) {
    const raices = propias.filter((u) => hijos.has(String(u.id)) && (u.dependeDe == null || u.dependeDe === ''))
    if (raices.length === 1) cabeza = raices[0]
  }
  if (!cabeza) return null
  const ids = new Set([String(cabeza.id)])
  const cola = [String(cabeza.id)]
  while (cola.length) for (const h of hijos.get(cola.shift()) || []) if (!ids.has(String(h.id))) (ids.add(String(h.id)), cola.push(String(h.id)))
  return { cabeza, ids }
}

// Las unidades con que trabaja la hoja: TODAS las enemigas (y lo que no es unidad) y, de las
// propias, sólo las del mando. `fuera`: las propias que quedan afuera (para decirlo en pantalla).
export function delMando(unidades, nombrePropia) {
  const lista = unidades || []
  const m = unidadDelMando(lista, nombrePropia)
  if (!m) return { unidades: lista, cabeza: null, fuera: [] }
  const fuera = lista.filter((u) => esPropiaU(u) && !m.ids.has(String(u.id)))
  if (!fuera.length) return { unidades: lista, cabeza: m.cabeza, fuera: [] }
  const sacar = new Set(fuera)
  return { unidades: lista.filter((u) => !sacar.has(u)), cabeza: m.cabeza, fuera }
}
export const rotuloUnidad = nombreDe
