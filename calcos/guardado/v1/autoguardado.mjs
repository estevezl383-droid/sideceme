// 💾 AUTOGUARDADO de la Mesa del EM (10-10-2026). Código legible aparte del compilado: el
// compilado lo importa (index-guardado-20261010.js) y sólo le pasa cómo armar el ejercicio y
// cómo guardarlo. Ver calcos/guardado/README.md.
//
// Lo pidió Sergio con una captura del sello «💾 guardado 10:34 a. m.»: «parece que no
// funciona, no autoguarda» y «que se le dé click y se quede guardado ese rato todo».
// Antes el sello sólo decía la hora y el minuto del último guardado y no se podía tocar:
// · si se guardaba otra vez dentro del mismo minuto, no cambiaba nada en pantalla;
// · si el guardado fallaba, el sello seguía con la hora vieja (el error salía en otro lado);
// · un cambio que no le avisaba a React (o hecho justo antes de cerrar la pestaña) no se
//   guardaba nunca, y el sello no decía que había algo sin guardar.
//
// Ahora:
// · Se guarda solo 2,5 s después de cada cambio (como antes) y, si los cambios no paran
//   (escribir de corrido, arrastrar), igual cada 15 s.
// · Cada 30 s compara el ejercicio con lo último guardado: si difiere, lo guarda (red de
//   seguridad para cambios que no dispararon el guardado).
// · Al irse de la pestaña (o minimizar) guarda lo pendiente, y si se cierra con algo sin
//   guardar el navegador pregunta antes de salir.
// · Si falla, el sello lo dice («⚠️ no se guardó · reintentar») y lo reintenta solo.
// · Tocar el sello (o Ctrl+S) guarda TODO en ese momento, aunque no haya cambios.
// · El sello dice el estado: «● sin guardar», «💾 guardando…», «✓ guardado 10:34:12».

export const ESPERA = 2500 // después del último cambio
export const ESPERA_MAX = 15000 // como mucho, aunque los cambios no paren
export const REVISION = 30000 // red de seguridad: comparar con lo último guardado
export const REINTENTOS = [10000, 30000, 60000] // después de un guardado fallido
// 13-11-2026 — Con una clase entera (225 equipos) cada guardado automático contra SIDECEME se
// espacia: después de uno que salió bien, el siguiente automático no sale antes de 45 a 75 s
// (al azar por equipo, para que no caigan todos juntos). Tocar el sello, Ctrl+S y salir de la
// pestaña guardan EN EL MOMENTO, como siempre.
export const MIN_ENTRE = [45000, 75000]
export const minEntreAlAzar = (azar = Math.random) => Math.round(MIN_ENTRE[0] + azar() * (MIN_ENTRE[1] - MIN_ENTRE[0]))

export function horaDe(ms) {
  try {
    return new Date(ms).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    return new Date(ms).toTimeString().slice(0, 8)
  }
}

// 2026-11-08 — Cuando la base no responde, Cloudflare devuelve su PÁGINA de error (HTML
// entero) y la Mesa la pegaba en rojo en el panel. Se muestra una sola línea.
export function errorLegible(e) {
  const t = String(e == null ? '' : e).trim()
  if (/<!doctype|<html|<head|<body/i.test(t)) {
    const cod = (t.match(/Error code\s*(\d{3})/i) || t.match(/\|\s*(\d{3})\s*:/) || t.match(/\b([45]\d\d)\b/) || [])[1]
    return 'el servidor de SIDECEME no respondió' + (cod ? ` (error ${cod})` : '')
  }
  return t.length > 200 ? t.slice(0, 200) + '…' : t
}

// El motor, sin React (se prueba en Node con un reloj falso).
//   foto()        → el ejercicio como se guarda (objeto), tal como está ahora
//   guardar(d)    → Promise<{ ok, error, vacio }> (ok === false es error)
//   ultimo        → { current: '' }: el JSON de lo último guardado; la Mesa lo vacía al
//                   abrir o crear un ejercicio para que se guarde de nuevo
//   alCambiar(e)  → cada vez que cambia el estado del sello
//   avisar(r)     → cuando un guardado falla (la Mesa muestra el error como siempre)
//   recuperado()  → cuando vuelve a guardar bien después de un error (la Mesa borra el aviso)
export function crearGuardador({
  foto,
  guardar,
  ultimo = { current: '' },
  alCambiar,
  avisar,
  recuperado,
  reloj = () => Date.now(),
  programar = (f, ms) => setTimeout(f, ms),
  cancelar = (t) => clearTimeout(t),
  espera = ESPERA,
  esperaMax = ESPERA_MAX,
  reintentos = REINTENTOS,
  minEntre = 0, // 0 = sin espaciar (como antes)
} = {}) {
  let estado = { fase: 'inactivo', hora: '', error: '', vacio: false }
  let activo = false
  let timer = null
  let desde = 0 // cuándo empezó lo que está sin guardar
  let enCurso = null
  let otraVez = null // pedido de guardar mientras otro guardado estaba en curso
  let fallos = 0
  let ultimoOk = 0 // cuándo salió bien el último guardado (para espaciar los automáticos)

  const poner = (e) => {
    estado = { ...estado, ...e }
    if (alCambiar) alCambiar(estado)
  }
  const parar = () => {
    if (timer != null) cancelar(timer)
    timer = null
  }
  const programarEn = (ms) => {
    parar()
    timer = programar(() => {
      timer = null
      guardarYa()
    }, ms)
  }

  // La Mesa cambió algo: guardar en 2,5 s (o al cumplirse los 15 s desde el primer cambio).
  function cambio() {
    if (!activo) return
    const t = reloj()
    if (!desde) desde = t
    // Recién abierto o creado (`ultimo` vacío) se guarda igual, pero no hay nada que perder: el
    // sello no dice «sin guardar» (ni la hora del ejercicio que estaba antes).
    if (ultimo.current === '') {
      if (estado.fase === 'al-dia' || estado.hora) poner({ fase: estado.fase === 'al-dia' ? 'inactivo' : estado.fase, hora: '' })
    } else if (estado.fase === 'al-dia' || estado.fase === 'inactivo') poner({ fase: 'pendiente' })
    if (estado.fase === 'error' && timer != null) return // ya hay un reintento programado
    let ms = Math.max(0, Math.min(espera, desde + esperaMax - t))
    if (minEntre && ultimoOk) ms = Math.max(ms, ultimoOk + minEntre - t)
    programarEn(ms)
  }

  // Guarda ahora. Sin `forzar`, si el ejercicio es igual a lo último guardado no hace nada.
  async function guardarYa({ forzar = false, urgente = false } = {}) {
    parar()
    if (!activo) return { ok: false, inactivo: true }
    if (enCurso) {
      otraVez = { forzar: forzar || !!(otraVez && otraVez.forzar), urgente: urgente || !!(otraVez && otraVez.urgente) }
      return enCurso
    }
    let datos, json
    try {
      datos = foto()
      json = JSON.stringify({ ...datos, guardadoEn: '' })
    } catch (e) {
      desde = 0
      poner({ fase: 'error', error: 'No se pudo preparar el ejercicio para guardarlo: ' + ((e && e.message) || e) })
      return { ok: false, error: String((e && e.message) || e) }
    }
    desde = 0
    if (!forzar && json === ultimo.current) {
      fallos = 0
      poner({ fase: estado.hora ? 'al-dia' : 'inactivo', error: '', vacio: false })
      return { ok: true, sinCambios: true }
    }
    poner({ fase: 'guardando' })
    enCurso = (async () => {
      try {
        return (await guardar(datos)) || { ok: true }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    })()
    const r = await enCurso
    enCurso = null
    if (r.ok === false) {
      fallos++
      r.error = errorLegible(r.error) || 'error desconocido'
      poner({ fase: 'error', error: r.error || 'error desconocido', vacio: !!r.vacio })
      if (avisar) avisar(r)
      // «vacío» es el candado que no deja pisar un ejercicio con trabajo con una pantalla en
      // blanco: reintentar no sirve, hay que abrir el ejercicio de nuevo.
      if (!r.vacio && activo) programarEn(reintentos[Math.min(fallos - 1, reintentos.length - 1)])
    } else {
      const veniaDeError = fallos > 0
      fallos = 0
      ultimoOk = reloj()
      ultimo.current = json
      if (veniaDeError && recuperado) recuperado()
      poner({ fase: 'al-dia', hora: horaDe(reloj()), error: '', vacio: false })
    }
    if (otraVez) {
      const o = otraVez
      otraVez = null
      // Algo cambió mientras se guardaba: con los guardados espaciados espera su turno, salvo
      // que lo haya pedido el oficial (el sello, Ctrl+S) o se esté yendo de la pestaña.
      if (activo && minEntre && !o.forzar && !o.urgente && r.ok !== false) cambio()
      else if (activo) return guardarYa(o)
    }
    return r
  }

  // Red de seguridad: si el ejercicio difiere de lo último guardado, guardarlo.
  function revisar() {
    if (!activo || enCurso || timer != null) return
    if (estado.fase === 'error' && estado.vacio) return
    if (minEntre && ultimoOk && reloj() - ultimoOk < minEntre) return // todavía no le toca
    guardarYa()
  }

  function activar(si) {
    activo = !!si
    if (!activo) {
      parar()
      desde = 0
      otraVez = null
      if (!enCurso) poner({ fase: 'inactivo', error: '', vacio: false })
    }
  }

  // Al irse de la pestaña: lo pendiente, ya.
  function alSalir() {
    if (activo && (timer != null || estado.fase === 'pendiente' || (estado.fase === 'error' && !estado.vacio))) guardarYa({ urgente: true })
  }

  // Hay algo que se perdería al cerrar. Recién abierto (`ultimo` vacío), lo de la pantalla es lo
  // que se acaba de abrir; con el candado de «vacío», está en blanco: en los dos no se pierde nada.
  const sinGuardar = () =>
    activo &&
    ((ultimo.current !== '' && (timer != null || estado.fase === 'pendiente')) ||
      enCurso != null ||
      estado.fase === 'guardando' ||
      (estado.fase === 'error' && !estado.vacio))

  return {
    cambio,
    guardarYa,
    revisar,
    activar,
    alSalir,
    sinGuardar,
    get estado() {
      return estado
    },
  }
}

// El gancho de React. `R` es el React del compilado (je).
//   activo  → hay ejercicio y no está finalizado
//   cambio  → cambia cada vez que cambia algo del ejercicio (el armador de la foto, Ud)
//   nombre  → el nombre del ejercicio
export function usarAutoguardado(R, op) {
  const ref = R.useRef(op)
  ref.current = op
  const [estado, setEstado] = R.useState({ fase: 'inactivo', hora: '', error: '', vacio: false })
  const motor = R.useMemo(
    () =>
      crearGuardador({
        foto: () => ref.current.foto(),
        guardar: (d) => ref.current.guardar(d),
        ultimo: op.ultimo,
        alCambiar: (e) => setEstado(e),
        avisar: (r) => ref.current.avisar && ref.current.avisar(r),
        recuperado: () => ref.current.recuperado && ref.current.recuperado(),
        minEntre: minEntreAlAzar(),
      }),
    [],
  )
  // El ejercicio TAL COMO ESTÁ en la Mesa, para los módulos de afuera que lo leen (el tablero del
  // profesor arma con él los pedidos a la IA). Con la Mesa publicada el ejercicio se guarda en
  // SIDECEME, no en el IndexedDB: sin esto el pedido salía sin el CMOC, la Orden ni el Área de
  // Interés (10-10-2026). Sólo lectura: la foto comparte objetos con el estado de React.
  R.useEffect(() => {
    window.SIDMesaEjercicio = {
      nombre: () => ref.current.nombre || '',
      foto: () => (ref.current.nombre ? ref.current.foto() : null),
    }
  }, [])
  R.useEffect(() => {
    motor.activar(op.activo)
  }, [op.activo])
  R.useEffect(() => {
    if (op.activo) motor.cambio()
  }, [op.activo, op.cambio, op.nombre])
  R.useEffect(() => {
    const oculta = () => {
      if (document.visibilityState === 'hidden') motor.alSalir()
    }
    const salir = () => motor.alSalir()
    // En la app de escritorio (Electron, file://) un «beforeunload» cancelado no pregunta: deja la
    // ventana sin cerrar. Ahí sólo se manda lo pendiente.
    const escritorio = location.protocol === 'file:' || /Electron/i.test(navigator.userAgent || '')
    const antes = (e) => {
      if (!motor.sinGuardar()) return
      motor.alSalir()
      if (escritorio) return
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    const teclas = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 's' || e.key === 'S')) {
        if (!ref.current.activo) return
        e.preventDefault()
        motor.guardarYa({ forzar: true })
      }
    }
    const idle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 5000 }) : (f) => f()
    const cada = setInterval(() => {
      if (document.visibilityState !== 'hidden') idle(() => motor.revisar())
    }, REVISION)
    document.addEventListener('visibilitychange', oculta)
    window.addEventListener('pagehide', salir)
    window.addEventListener('beforeunload', antes)
    window.addEventListener('keydown', teclas)
    return () => {
      clearInterval(cada)
      document.removeEventListener('visibilitychange', oculta)
      window.removeEventListener('pagehide', salir)
      window.removeEventListener('beforeunload', antes)
      window.removeEventListener('keydown', teclas)
      motor.activar(false)
    }
  }, [])
  return { ...estado, guardarYa: motor.guardarYa, motor }
}

// Lo que muestra el sello (un botón: tocarlo guarda todo en ese momento).
export function sello(ag, finalizado) {
  if (finalizado) return { 'data-estado': 'finalizado', disabled: true, title: 'Ejercicio finalizado: no se autoguarda.', children: '🔒 finalizado' }
  const base = 'Se guarda solo (como mucho una vez por minuto, y al salir de la pestaña), incluidas las hojas de trabajo.'
  const tocar = 'Tocá acá (o Ctrl+S) para guardar todo AHORA.'
  const onClick = () => ag.guardarYa({ forzar: true })
  const f = ag.fase
  if (f === 'guardando') return { 'data-estado': f, onClick, title: 'Guardando el ejercicio…', children: '💾 guardando…' }
  if (f === 'pendiente') return { 'data-estado': f, onClick, title: 'Hay cambios que se guardan solos dentro del minuto. ' + tocar, children: '● sin guardar · guardar' }
  if (f === 'error')
    return {
      'data-estado': f,
      onClick,
      title: '⚠️ No se pudo guardar: ' + ag.error + (ag.vacio ? '' : ' — se reintenta solo. ') + tocar,
      children: '⚠️ no se guardó · reintentar',
    }
  if (ag.hora) return { 'data-estado': 'al-dia', onClick, title: 'Todo guardado a las ' + ag.hora + '. ' + base + ' ' + tocar, children: '✓ guardado ' + ag.hora }
  return { 'data-estado': 'activo', onClick, title: base + ' ' + tocar, children: '💾 autoguardado activo' }
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// 📦 GUARDAR SÓLO LO QUE CAMBIÓ (13-11-2026)
//
// Sergio, con el examen encima: «debe estar en posibilidades de ser usada por 250 alumnos… la
// otra vez no pudieron usarla ni 6». Qué pasaba: cada guardado mandaba el ejercicio ENTERO (3 a
// 6 MB con los calcos del terreno adentro) y se guardaba 2,5 s después de cada cambio. Seis
// equipos ya eran unos 5 MB por segundo de subida: la conexión del aula no da para eso.
//
// Ahora la Mesa manda sólo las partes (claves de primer nivel del ejercicio) que cambiaron desde
// lo último que el servidor confirmó. Los calcos del terreno viajan una sola vez.
// · El servidor numera cada guardado (`rev`). El cambio se aplica sólo si la `rev` es la que la
//   Mesa conoce; si no (otra pestaña, otro integrante del grupo), contesta 409 y se manda entero,
//   como antes. Nunca se mezcla a ciegas.
// · Con un servidor que no numera (función vieja) no se manda ningún cambio suelto: todo entero.
// · Para apagarlo: `localStorage.sidDelta = '0'` y recargar. Estado: `SIDGuardadoDelta.estado()`.
// No toca el compilado: se engancha en `fetch` para los pedidos a `calco-ops`.
// ─────────────────────────────────────────────────────────────────────────────────────────
export const DELTA_MAX = 0.7 // si lo que cambió pesa más que esto del total, va entero

// ¿Son el mismo JSON? (el orden de las claves no cuenta: la base las reordena)
export function igualJSON(a, b) {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  const la = Array.isArray(a)
  if (la !== Array.isArray(b)) return false
  if (la) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!igualJSON(a[i], b[i])) return false
    return true
  }
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false
    if (!igualJSON(a[k], b[k])) return false
  }
  return true
}

const partesDe = (payload) => {
  const m = new Map()
  for (const k of Object.keys(payload)) {
    const t = JSON.stringify(payload[k])
    if (t !== undefined) m.set(k, t)
  }
  return m
}

export function crearDelta({ fetch0, activo = () => true } = {}) {
  // calco_id → { rev, partes: Map(clave → JSON), crudo: lo que mandó el servidor al abrir | null }
  const bases = new Map()
  const cuenta = { sueltos: 0, enteros: 0, conflictos: 0, bytesSueltos: 0, bytesEnteros: 0, bytesAhorrados: 0 }
  let cola = Promise.resolve()
  const enCola = (f) => {
    const p = cola.then(f, f)
    cola = p.then(() => {}, () => {})
    return p
  }
  const leer = async (r) => {
    try {
      return await r.clone().json()
    } catch (e) {
      return null
    }
  }

  // Al abrir: lo que el servidor tiene es la base.
  function anotarAbierto(j) {
    const c = j && j.ok !== false && j.calco
    if (!c || !c.id || typeof c.rev !== 'number' || !c.payload || typeof c.payload !== 'object' || Array.isArray(c.payload)) return
    bases.set(c.id, { rev: c.rev, partes: partesDe(c.payload), crudo: c.payload })
  }

  async function guardar(u, o) {
    let cuerpo
    try {
      cuerpo = JSON.parse(o.body)
    } catch (e) {
      return fetch0(u, o)
    }
    const id = cuerpo.calco_id
    const payload = cuerpo.payload
    if (!id || !payload || typeof payload !== 'object' || Array.isArray(payload)) return fetch0(u, o)
    const nuevas = partesDe(payload)
    const base = bases.get(id)
    if (base) {
      const cambios = {}
      const quitar = []
      for (const [k, t] of nuevas) {
        const antes = base.partes.get(k)
        if (antes === t) continue
        if (antes !== undefined && base.crudo && igualJSON(payload[k], base.crudo[k])) continue
        cambios[k] = payload[k]
      }
      for (const k of base.partes.keys()) if (!nuevas.has(k)) quitar.push(k)
      const { calco_id, payload: _p, ...resto } = cuerpo // accion, token, nombre, pais…
      const suelto = JSON.stringify({ ...resto, calco_id: null, delta: { calco_id: id, base_rev: base.rev, cambios, quitar } })
      if (suelto.length < o.body.length * DELTA_MAX) {
        const r = await fetch0(u, { ...o, body: suelto })
        const j = await leer(r)
        if (r.ok && j && j.ok !== false && typeof j.rev === 'number') {
          bases.set(id, { rev: j.rev, partes: nuevas, crudo: null })
          cuenta.sueltos++
          cuenta.bytesSueltos += suelto.length
          cuenta.bytesAhorrados += o.body.length - suelto.length
          return r
        }
        // 409: otro guardó en el medio. 404/400: la función no entiende. En los tres, entero.
        // Cualquier otra cosa (sesión vencida, servidor caído) se devuelve como está: mandar el
        // ejercicio entero a un servidor que no responde sólo lo empeora. La Mesa reintenta.
        if (r.status !== 409 && r.status !== 404 && r.status !== 400) return r
        cuenta.conflictos++
        bases.delete(id)
      }
    }
    const r = await fetch0(u, o)
    const j = await leer(r)
    if (r.ok && j && j.ok !== false && typeof j.rev === 'number') bases.set(id, { rev: j.rev, partes: nuevas, crudo: null })
    else bases.delete(id)
    cuenta.enteros++
    cuenta.bytesEnteros += o.body.length
    return r
  }

  function pedir(u, o) {
    let url = ''
    try {
      url = String((u && u.url) || u || '')
    } catch (e) {}
    if (!/functions\/v1\/calco-ops/.test(url) || !o || typeof o.body !== 'string' || !activo()) return fetch0(u, o)
    const accion = (o.body.slice(0, 300).match(/"accion":"(\w+)"/) || [])[1] || ''
    if (accion === 'guardar') return enCola(() => guardar(u, o))
    if (accion === 'mi_calco' || accion === 'abrir_mio' || accion === 'abrir') {
      const p = fetch0(u, o)
      // La copia se saca ANTES de que la Mesa lea la respuesta (después ya no se puede).
      const copia = p.then((r) => (r.ok ? r.clone() : null), () => null)
      enCola(() => copia.then((c) => (c ? c.json().then(anotarAbierto, () => {}) : null), () => null))
      return p
    }
    if (accion === 'entregar' || accion === 'borrar_mio') {
      // Después de una entrega (o de borrar) la base ya no vale: el próximo guardado va entero.
      return enCola(() => {
        bases.clear()
        return fetch0(u, o)
      })
    }
    return fetch0(u, o)
  }

  return {
    fetch: pedir,
    estado: () => ({ ...cuenta, abiertos: [...bases].map(([id, b]) => ({ id, rev: b.rev, partes: b.partes.size })) }),
  }
}

export function instalarDelta(w) {
  try {
    if (!w || typeof w.fetch !== 'function' || w.fetch.__sidDelta) return null
    let apagado = false
    try {
      apagado = w.localStorage && w.localStorage.getItem('sidDelta') === '0'
    } catch (e) {}
    if (apagado) return null
    const f0 = w.fetch
    const d = crearDelta({ fetch0: (u, o) => f0.call(w, u, o) })
    const f = function (u, o) {
      return d.fetch(u, o)
    }
    f.__sidDelta = true
    if (f0.__sidResguardo) f.__sidResguardo = true // que el resguardo no se enganche dos veces
    w.fetch = f
    w.SIDGuardadoDelta = { estado: d.estado }
    return d
  } catch (e) {
    return null
  }
}

if (typeof window !== 'undefined') instalarDelta(window)
