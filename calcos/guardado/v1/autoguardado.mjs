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

export function horaDe(ms) {
  try {
    return new Date(ms).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch (e) {
    return new Date(ms).toTimeString().slice(0, 8)
  }
}

// El motor, sin React (se prueba en Node con un reloj falso).
//   foto()        → el ejercicio como se guarda (objeto), tal como está ahora
//   guardar(d)    → Promise<{ ok, error, vacio }> (ok === false es error)
//   ultimo        → { current: '' }: el JSON de lo último guardado; la Mesa lo vacía al
//                   abrir o crear un ejercicio para que se guarde de nuevo
//   alCambiar(e)  → cada vez que cambia el estado del sello
//   avisar(r)     → cuando un guardado falla (la Mesa muestra el error como siempre)
export function crearGuardador({
  foto,
  guardar,
  ultimo = { current: '' },
  alCambiar,
  avisar,
  reloj = () => Date.now(),
  programar = (f, ms) => setTimeout(f, ms),
  cancelar = (t) => clearTimeout(t),
  espera = ESPERA,
  esperaMax = ESPERA_MAX,
  reintentos = REINTENTOS,
} = {}) {
  let estado = { fase: 'inactivo', hora: '', error: '', vacio: false }
  let activo = false
  let timer = null
  let desde = 0 // cuándo empezó lo que está sin guardar
  let enCurso = null
  let otraVez = null // pedido de guardar mientras otro guardado estaba en curso
  let fallos = 0

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
    programarEn(Math.max(0, Math.min(espera, desde + esperaMax - t)))
  }

  // Guarda ahora. Sin `forzar`, si el ejercicio es igual a lo último guardado no hace nada.
  async function guardarYa({ forzar = false } = {}) {
    parar()
    if (!activo) return { ok: false, inactivo: true }
    if (enCurso) {
      otraVez = { forzar: forzar || !!(otraVez && otraVez.forzar) }
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
      poner({ fase: 'error', error: r.error || 'error desconocido', vacio: !!r.vacio })
      if (avisar) avisar(r)
      // «vacío» es el candado que no deja pisar un ejercicio con trabajo con una pantalla en
      // blanco: reintentar no sirve, hay que abrir el ejercicio de nuevo.
      if (!r.vacio && activo) programarEn(reintentos[Math.min(fallos - 1, reintentos.length - 1)])
    } else {
      fallos = 0
      ultimo.current = json
      poner({ fase: 'al-dia', hora: horaDe(reloj()), error: '', vacio: false })
    }
    if (otraVez) {
      const o = otraVez
      otraVez = null
      if (activo) return guardarYa(o)
    }
    return r
  }

  // Red de seguridad: si el ejercicio difiere de lo último guardado, guardarlo.
  function revisar() {
    if (!activo || enCurso || timer != null) return
    if (estado.fase === 'error' && estado.vacio) return
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
    if (activo && (timer != null || estado.fase === 'pendiente' || (estado.fase === 'error' && !estado.vacio))) guardarYa()
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
  const base = 'Se guarda solo 2,5 s después de cada cambio, incluidas las hojas de trabajo.'
  const tocar = 'Tocá acá (o Ctrl+S) para guardar todo AHORA.'
  const onClick = () => ag.guardarYa({ forzar: true })
  const f = ag.fase
  if (f === 'guardando') return { 'data-estado': f, onClick, title: 'Guardando el ejercicio…', children: '💾 guardando…' }
  if (f === 'pendiente') return { 'data-estado': f, onClick, title: 'Hay cambios que se guardan en unos segundos. ' + tocar, children: '● sin guardar · guardar' }
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
