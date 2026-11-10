// 🎯 Mover un objetivo del enemigo con el mouse — 10-11-2026.
//
// Sergio, con la H.T. 16 abierta: «quisiera que me des la opción de poder mover y reacomodar los
// objetivos y que obviamente se sincronice todo». Hasta hoy O1, Oa, Ob… se acostaban y quedaban
// fijos: el rótulo no se podía agarrar.
//
// Ahora el rótulo del objetivo se arrastra en la carta. Al soltarlo:
//   · el objetivo queda donde se soltó (`movido: true`);
//   · si cayó a ≤ 3 km de un terreno clave del CMOC, queda «apoyado en» ese terreno clave (su
//     nombre en la H.T. 16); si se alejó del que tenía, lo pierde;
//   · las flechas del esquema de maniobra (H.T. 17) se rehacen para que sigan llegando al objetivo,
//     cada forma con su CAE-1 / CAE-2.
// Todo lo demás (maqueta 3D, Word, la IA) lee los mismos `ops.objetivos`, así que se entera solo.

const R = 6371.0088
const rad = (g) => (g * Math.PI) / 180
export function distanciaKm(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return Infinity
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const centroDe = (c) => (Array.isArray(c?.centro) ? c.centro : Array.isArray(c?.coords?.[0]) ? c.coords[0] : null)

// El terreno clave más cercano a ≤ km (como oK del compilado: etiqueta o nombre).
export function claveCercana(claves = [], punto, km = 3) {
  let mejor = null
  ;(claves || []).forEach((c, i) => {
    const p = centroDe(c)
    if (!p) return
    const d = distanciaKm(punto, p)
    if (d <= km && (!mejor || d < mejor.d)) mejor = { d, nom: String(c.etiqueta || c.nombre || `C${i + 1}`).trim() }
  })
  return mejor
}

const nombreObjetivo = (o, apoyo) =>
  o.clase === 'final'
    ? apoyo
      ? `OBJETIVO FINAL · terreno clave ${apoyo}`
      : 'OBJETIVO FINAL'
    : apoyo
      ? `Terreno clave ${apoyo}`
      : 'Objetivo intermedio'

// ops: las operaciones del calco. idx: cuál objetivo. centro: [lng, lat].
// rehacer(plantilla, objetivos, forma) → { ok, flechas } (Z0e del compilado).
export function moverObjetivo(ops, idx, centro, { claves = [], plantilla = null, rehacer = null, km = 3 } = {}) {
  const objetivos = Array.isArray(ops?.objetivos) ? ops.objetivos : []
  const o = objetivos[idx]
  if (!o || !Array.isArray(centro) || !centro.every(Number.isFinite)) return { ops, resumen: null }
  const c = [Math.round(centro[0] * 1e6) / 1e6, Math.round(centro[1] * 1e6) / 1e6]
  const cerca = claveCercana(claves, c, km)
  const apoyo = cerca ? cerca.nom : ''
  const nuevo = { ...o, centro: c, apoyadoEn: apoyo, nom: nombreObjetivo(o, apoyo), movido: true }
  const lista = objetivos.map((x, i) => (i === idx ? nuevo : x))

  // Las flechas: cada grupo (forma + CAE) se rehace con los objetivos nuevos.
  let maniobra = Array.isArray(ops?.maniobra) ? ops.maniobra : []
  let rehechas = 0
  if (maniobra.length && plantilla && typeof rehacer === 'function') {
    const grupos = []
    for (const f of maniobra) {
      const k = `${f.forma || ''}|${f.cae || ''}`
      if (!grupos.some((g) => g.k === k)) grupos.push({ k, forma: f.forma || null, cae: f.cae || null })
    }
    let salida = []
    for (const g of grupos) {
      const viejas = maniobra.filter((f) => `${f.forma || ''}|${f.cae || ''}` === g.k)
      let r = null
      try {
        r = rehacer(plantilla, lista, g.forma)
      } catch {
        r = null
      }
      if (r?.ok && r.flechas?.length) {
        salida = salida.concat(r.flechas.map((f) => (g.cae ? { ...f, cae: g.cae } : f)))
        rehechas++
      } else salida = salida.concat(viejas)
    }
    maniobra = salida
  }
  return {
    ops: { ...ops, objetivos: lista, ...(rehechas ? { maniobra } : {}) },
    resumen: { etiqueta: o.etiqueta || '', apoyo, antes: o.apoyadoEn || '', formas: rehechas },
  }
}

export function avisoMovido(r) {
  const s = r?.resumen
  if (!s) return ''
  const partes = [`🎯 ${s.etiqueta} movido.`]
  if (s.apoyo) partes.push(`Queda apoyado en el terreno clave ${s.apoyo}.`)
  else if (s.antes) partes.push(`Ya no está sobre el terreno clave ${s.antes}.`)
  if (s.formas) partes.push(`Se rehicieron las flechas de ${s.formas} forma(s) de acción para que lleguen al objetivo.`)
  partes.push('En la H.T. 16, «🌱 Traer del calco lo que falte» toma la ubicación nueva. «↶ Deshacer» lo vuelve atrás.')
  return partes.join(' ')
}
