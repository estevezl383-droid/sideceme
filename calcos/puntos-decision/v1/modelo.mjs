// Los puntos de decisión de la F4·P4 (g3.eventos) llevados a la carta: cada renglón que nombra una A.I.N.
// que está en el calco (ops.ains) va como una ⭐ con su número al lado de esa A.I.N. Sin dependencias: lo usan
// carta.js (en la Mesa) y las pruebas (en Node).
//
// Sergio, 24-10-2026, con la F4·P4 que le escribió la IA: «me gustaría que lo pongas en la maqueta para
// identificar… no quiero que pongas más texto». Por eso en la carta va sólo la estrella con su número; lo
// escrito (ventana, criterio, decisión) se ve al tocarla.

const TAG = /\s*\[IA\s*[—–-]\s*verificar\]\s*/gi
export const limpiar = (s) => String(s ?? '').replace(TAG, ' ').replace(/\s+/g, ' ').trim()
export const deIA = (fila) => Object.values(fila || {}).some((v) => /\[IA\s*[—–-]\s*verificar\]/i.test(String(v ?? '')))

// «AIN-3», «A.I.N. 3», «AIN 3 (paso Ungallire)», «ain3» → «AIN3».
const claveAIN = (s) => {
  const m = String(s ?? '').toUpperCase().replace(/\./g, '').match(/AIN\s*[-–N°º]*\s*(\d+)/)
  return m ? `AIN${Number(m[1])}` : ''
}
const nomAIN = (a) => a?.nom || (a?.n != null ? `AIN-${a.n}` : '')

// Todas las A.I.N. que nombra una celda, en orden («AIN-3 / AIN-5» → ['AIN3','AIN5']).
export function ainsNombradas(s) {
  const out = []
  const re = /A\.?\s*I\.?\s*N\.?\s*[-–N°º]*\s*(\d+)/gi
  let m
  while ((m = re.exec(String(s ?? '')))) {
    const k = `AIN${Number(m[1])}`
    if (!out.includes(k)) out.push(k)
  }
  return out
}

const valido = (c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1])

// Los P.D. de la hoja con su lugar en la carta.
//   filas: g3.eventos · ains: ops.ains · pos: g3.pdCarta.pos (los que se arrastraron, por número)
// Devuelve { puntos: [{ n, num, ain, centro, movido, k, evento, noAntes, noDespues, criterio, decision, ia }],
//            sinAIN: [números de P.D. que no nombran una A.I.N. del calco] }
// `k` es el lugar del P.D. entre los de su misma A.I.N. (0, 1, 2…): carta.js los pone uno al lado del otro.
export function puntosDeDecision(filas, ains, pos = {}) {
  const porClave = new Map()
  for (const a of ains || []) {
    const k = claveAIN(nomAIN(a))
    if (k && valido(a?.centro) && !porClave.has(k)) porClave.set(k, a)
  }
  const puntos = []
  const sinAIN = []
  const enAIN = new Map()
  const usados = new Set()
  ;(Array.isArray(filas) ? filas : []).forEach((f, i) => {
    if (!f || typeof f !== 'object') return
    const evento = limpiar(f['Evento crítico'])
    const decision = limpiar(f['Decisión que se toma'])
    const criterio = limpiar(f['Criterio que activa la decisión'])
    if (!evento && !decision && !criterio) return
    const nCel = limpiar(f['N° P.D.'])
    let num = Number((nCel.match(/\d+/) || [])[0]) || i + 1
    while (usados.has(num)) num++
    usados.add(num)
    const a = ainsNombradas(f['A.I.N. asociada']).map((k) => porClave.get(k)).find(Boolean)
    const movido = valido(pos?.[num]) ? [+pos[num][0], +pos[num][1]] : null
    if (!a && !movido) {
      sinAIN.push(num)
      return
    }
    const ain = a ? nomAIN(a) : limpiar(f['A.I.N. asociada'])
    const k = a && !movido ? enAIN.get(ain) || 0 : 0
    if (a && !movido) enAIN.set(ain, k + 1)
    puntos.push({
      n: i,
      num,
      ain,
      centro: movido || [+a.centro[0], +a.centro[1]],
      movido: !!movido,
      k,
      evento,
      noAntes: limpiar(f['No antes de']),
      noDespues: limpiar(f['No después de']),
      criterio,
      decision,
      ia: deIA(f),
    })
  })
  return { puntos, sinAIN }
}
