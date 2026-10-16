// ✂️ La tijera de la barra principal (16-10-2026).
//
// Lo pidió Sergio con las capturas de FABBLE 1.1: «la opción de cortar la quiero en el menú
// principal… esa herramienta debe ser capaz de cortar el polígono tomando como referencia los
// límites de las unidades… debe cortar la línea por donde pasa el lazo… y seleccionar todo lo que
// esté activado» (también las fichas rojas). Al preguntarle eligió ver ANTES lo que se va a cortar:
// al soltar el lazo se pinta en la carta, se tocan zonas para sumarlas o quitarlas y recién con
// «✓ Cortar y guardar» entran el área nueva y su selección guardada (una sola foto del ↶ Deshacer).
//
// La monta el compilado siempre (no sólo con el panel ▧ abierto). La llaman el botón «✂️ Cortar
// área» de la barra y el del panel ▧ Área de Ops, con pedirTijera(). Lo que entrega (recortarContenido)
// va cortado por donde pasó el lazo: ver recorte.mjs · «La tijera».

import { repartir, resumenContenido, simplificarLazo, capasCmocVisibles } from './recorte.mjs?v=tijera20261016'
import { listarAreas, recortarArea, guardarSeleccion, listarSelecciones, paqueteSeleccion, contenidoTijera, vistaLimpia } from './modelo.mjs?v=tijera20261016'
import { iniciarLazo, carta2D, vistaPrevia } from './lazo.mjs?v=tijera20261016'

export const EVENTO_TIJERA = 'sid-tijera'
export const EVENTO_COMPARTIR = 'sid-compartir-seleccion'
export function pedirTijera() { try { window.dispatchEvent(new CustomEvent(EVENTO_TIJERA)) } catch {} }
// El panel ▧ (editor.mjs) abre «Compartir» con esta selección al montarse o al recibir el aviso.
export function pedirCompartir(id) {
  try { window.__sidPedidoCompartir = { id, n: Date.now() }; window.dispatchEvent(new CustomEvent(EVENTO_COMPARTIR)) } catch {}
}
// Los calcos del terreno del ejercicio abierto (los deja el autoguardado en SIDMesaEjercicio).
export function terrenoDeLaMesa() { try { return window.SIDMesaEjercicio?.foto?.()?.resultados || null } catch { return null } }

const nuevoId = pre => `${pre}-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)}`
const archivoDe = n => String(n || 'area').replace(/[^\wÁÉÍÓÚÑáéíóúñ.-]+/g, '_')
const bajarJSON = (nombre, p) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(p)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = nombre; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

// verCapa: las teclas de «Qué se ve en el calco»; clandestinos: el botón «🟥 Clandestinos»;
// calcosVisibles: los calcos del terreno prendidos; resultados: los calcos generados; escalon: la
// «Magnitud que se va a colocar» (nombre del área nueva: CE-I, CE-II…); herramienta/onHerramienta:
// la tijera apaga la herramienta de dibujo y viceversa; onAbrirAreas: abre el panel ▧ Área de Ops.
export default function Tijera({ react: R, ops, onOps, ejercicio, onDeshacer, unidades, cmoc, verCapa, clandestinos, calcosVisibles, resultados, escalon, herramienta, onHerramienta, onAbrirAreas }) {
  const h = R.createElement
  const [fase, setFase] = R.useState(null) // null · 'lazo' · 'vista' · 'guardada' · 'aviso'
  const [sel, setSel] = R.useState(null) // { lazo } o { punto }
  const [toques, setToques] = R.useState([])
  const [nombre, setNombre] = R.useState(''), tocado = R.useRef(false)
  const [entrega, setEntrega] = R.useState({ contenido: true, enemigo: true, cmoc: true })
  const [error, setError] = R.useState(''), [aviso, setAviso] = R.useState('')
  const [guardada, setGuardada] = R.useState(null), [pendiente, setPendiente] = R.useState(null)
  const lazoRef = R.useRef(null), vistaRef = R.useRef(null)
  const vigente = R.useRef({}); vigente.current = { ops, fase }
  const opsSeguras = ops && typeof ops === 'object' ? ops : {}

  const apagar = () => { lazoRef.current?.(); lazoRef.current = null; vistaRef.current?.detener(); vistaRef.current = null }
  const cerrar = () => { apagar(); setFase(null); setSel(null); setToques([]); setError(''); setAviso(''); setGuardada(null); setPendiente(null) }
  R.useEffect(() => () => apagar(), [])
  R.useEffect(() => { cerrar() }, [ejercicio])
  R.useEffect(() => { if (herramienta && (vigente.current.fase === 'lazo' || vigente.current.fase === 'vista')) cerrar() }, [herramienta])

  const empezar = () => {
    apagar(); setError(''); setAviso(''); setGuardada(null); setPendiente(null); setToques([]); setSel(null)
    tocado.current = false
    if (!listarAreas(vigente.current.ops || {}).length) { setFase('aviso'); setError('Primero trace el Área de Operaciones que va a repartir (▧ Área de Ops → ▧ Trazar el Área).'); return }
    const mapa = carta2D()
    if (!mapa) { setFase('aviso'); setError('La tijera corta sobre la carta 2D: pase a 2D y vuelva a tocar ✂️ Cortar área.'); return }
    onHerramienta?.(null)
    lazoRef.current = iniciarLazo(mapa, {
      alTerminar: s => {
        lazoRef.current = null
        const lz = s.lazo ? simplificarLazo(s.lazo) : null
        setSel(lz && lz.length >= 3 ? { lazo: lz } : { punto: s.punto || s.lazo?.[0] }); setToques([]); setFase('vista')
      },
      alCancelar: () => { lazoRef.current = null; setFase(null) },
    })
    setFase('lazo')
  }
  const empezarRef = R.useRef(empezar); empezarRef.current = empezar
  const cerrarRef = R.useRef(cerrar); cerrarRef.current = cerrar
  R.useEffect(() => {
    const fn = () => { if (vigente.current.fase === 'lazo' || vigente.current.fase === 'vista') cerrarRef.current(); else empezarRef.current() }
    window.addEventListener(EVENTO_TIJERA, fn)
    return () => window.removeEventListener(EVENTO_TIJERA, fn)
  }, [])

  // Lo que se va a cortar, con los toques de la vista previa.
  const r = R.useMemo(() => {
    if (!sel || (fase !== 'vista' && !pendiente)) return null
    try { return repartir(listarAreas(opsSeguras), opsSeguras.limites || [], { ...sel, toques }) } catch (e) { return { ok: false, error: e.message } }
  }, [ops, sel, toques, fase])
  const propuesto = R.useMemo(() => {
    if (!r?.ok) return ''
    try { return recortarArea(opsSeguras, { ...sel, toques }, { escalon: escalon || '' }).area.nombre } catch { return '' }
  }, [r, escalon])
  R.useEffect(() => { if (propuesto && !tocado.current) setNombre(propuesto) }, [propuesto])

  const vista = () => vistaLimpia({ verCapa, clandestinos, calcos: calcosVisibles })
  const resumen = R.useMemo(() => {
    if (fase !== 'vista' || !r?.ok) return ''
    if (!entrega.contenido) return 'sólo el contorno'
    try {
      const prueba = { coords: r.coords, areaId: '__tijera', opciones: entrega, tijera: { lazo: sel?.lazo || null, vista: vista() } }
      return resumenContenido(contenidoTijera(opsSeguras, prueba, { unidades, cmoc, resultados: resultados || terrenoDeLaMesa() }))
    } catch { return '' }
  }, [fase, r, entrega.contenido, entrega.enemigo, entrega.cmoc, ops, unidades, cmoc, verCapa, clandestinos, calcosVisibles, resultados])

  // La vista previa en la carta.
  R.useEffect(() => {
    if (fase !== 'vista') { vistaRef.current?.detener(); vistaRef.current = null; return }
    const mapa = carta2D()
    if (!mapa) return
    if (!vistaRef.current) vistaRef.current = vistaPrevia(mapa, { alTocar: p => setToques(t => [...t, p]), alCancelar: () => { vistaRef.current = null; cerrarRef.current() } })
    vistaRef.current.poner({ zonas: r?.zonas || [], area: r?.ok ? r.coords : null, lazo: sel?.lazo || null })
  }, [fase, r])

  // ✓ Cortar y guardar: el área nueva (con el nombre) y su selección guardada, en un solo paso.
  const guardar = () => {
    if (!r?.ok || !nombre.trim() || pendiente) return
    const areaId = nuevoId('ao'), selId = nuevoId('sel'), ahora = new Date().toISOString()
    const s = { ...sel, toques }
    const tijera = { lazo: sel?.lazo || null, vista: vista() }
    const capas = entrega.cmoc && cmoc && typeof cmoc === 'object' ? capasCmocVisibles(cmoc, verCapa || {}, { clandestinos }) : []
    const armar = prev => {
      const a = recortarArea(prev, s, { escalon: escalon || '', id: areaId })
      return guardarSeleccion(a.ops, { areaId, nombre, opciones: entrega, capasCmoc: capas, tijera, id: selId, ahora }).ops
    }
    try { armar(opsSeguras) } catch (e) { setError(e.message); return }
    setError('')
    onDeshacer?.()
    onOps(prev => { try { return armar(prev) } catch { return prev } })
    setPendiente({ id: selId, nombre: nombre.replace(/\s+/g, ' ').trim(), desde: Date.now() })
  }
  // Recién cuando la selección está en el ejercicio se da por guardada (con candado, no llega).
  R.useEffect(() => {
    if (!pendiente) return
    if (listarSelecciones(opsSeguras).some(s => s.id === pendiente.id)) {
      vistaRef.current?.detener(); vistaRef.current = null
      setGuardada(pendiente); setPendiente(null); setFase('guardada'); setAviso('')
      return
    }
    const t = setTimeout(() => { setPendiente(null); setError('No se guardó: el ejercicio está con candado (BASE de otro puesto o finalizado).') }, 1500)
    return () => clearTimeout(t)
  }, [ops, pendiente])

  const laGuardada = () => listarSelecciones(opsSeguras).find(x => x.id === guardada?.id)
  const bajar = () => {
    const s = laGuardada()
    if (!s) { setError('La selección ya no está en el ejercicio (¿se deshizo?).'); return }
    try {
      bajarJSON(`Seleccion_${archivoDe(s.nombre)}.json`, paqueteSeleccion(opsSeguras, s, ejercicio, { unidades, cmoc, resultados: resultados || terrenoDeLaMesa() }))
      setAviso(`⬇️ Seleccion_${archivoDe(s.nombre)}.json bajado. Se abre con 📁 Ejercicios → «📂 Abrir archivo JSON» (como ejercicio nuevo).`)
    } catch (e) { setError(e.message) }
  }
  const compartir = () => { const s = laGuardada(); if (!s) { setError('La selección ya no está en el ejercicio (¿se deshizo?).'); return } pedirCompartir(s.id); onAbrirAreas?.(); cerrar() }

  if (!fase) return null
  // A la izquierda, encima de la barra lateral (durante el corte no se usa): no tapa la carta que se
  // corta ni el panel ▧ de la derecha.
  const caja = {
    position: 'fixed', top: 104, left: 8, width: 'min(318px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
    zIndex: 1600, background: '#0e1320', color: '#e8edf5', border: '1px solid #5ce1ff', borderRadius: 10, padding: 12,
    boxShadow: '0 8px 28px rgba(0,0,0,.45)', display: 'grid', gap: 8, fontSize: 14, boxSizing: 'border-box',
  }
  const boton = { background: '#16223a', color: '#e8edf5', border: '1px solid #34405a', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', fontSize: 14, width: '100%' }
  const verde = { ...boton, background: '#0d5d3a', borderColor: '#39d98a' }
  const titulo = h('strong', { style: { fontSize: 15 } }, '✂️ Tijera')
  const quitar = h('button', { type: 'button', style: boton, onClick: cerrar }, '✕ Cancelar')
  const mensajes = [
    error && h('div', { key: 'e', role: 'alert', style: { color: '#ff9d9d' } }, error),
    aviso && h('p', { key: 'a', role: 'status', style: { margin: 0, color: '#a9ffcf' } }, aviso),
  ]
  if (fase === 'aviso') return h('section', { 'aria-label': 'Tijera', style: caja }, titulo, ...mensajes, h('button', { type: 'button', style: boton, onClick: cerrar }, 'Cerrar'))
  if (fase === 'lazo') return h('section', { 'aria-label': 'Tijera', style: caja }, titulo,
    h('span', null, 'Encierre a mano alzada (mouse, dedo o lápiz) la zona del escalón subordinado, sin precisión: el corte sigue los límites de las unidades. Lo de adentro se entrega cortado por donde pase su trazo. Un toque dentro de una zona la elige sola. Esc cancela.'),
    quitar)
  if (fase === 'guardada') return h('section', { 'aria-label': 'Tijera', style: caja }, titulo,
    h('p', { role: 'status', style: { margin: 0, color: '#a9ffcf' } }, `💾 «${guardada?.nombre}» guardada: el área quedó en la carta y la selección en ▧ Área de Ops → «Selecciones guardadas», con lo que se veía cortado por donde pasó la tijera.`),
    ...mensajes,
    h('button', { type: 'button', style: verde, onClick: bajar }, '⬇️ Bajar el JSON de la selección'),
    h('button', { type: 'button', style: boton, onClick: compartir }, '📤 Compartir (ciclo / paralelo)'),
    h('button', { type: 'button', style: boton, onClick: empezar }, '✂️ Cortar otra'),
    h('button', { type: 'button', style: boton, onClick: cerrar }, 'Cerrar'))
  // Vista previa
  const notas = r?.ok ? [
    r.libre ? 'No había límites que dividieran el área: se corta por el trazo.' : `Por los límites de las unidades${r.piezas > 1 ? ` (${r.piezas} zonas unidas)` : ''}.`,
    r.dejadas?.length ? `Lo que ya es de «${r.dejadas.join('», «')}» quedó afuera.` : '',
    r.encima?.length ? `⚠️ Queda encima de «${r.encima.join('», «')}».` : '',
    r.separadas ? 'Hay zonas que no se tocan: queda la más grande.' : '',
  ].filter(Boolean).join(' ') : ''
  const casilla = (k, texto) => h('label', { key: k, style: { display: 'flex', gap: 6, alignItems: 'center' } },
    h('input', { type: 'checkbox', checked: entrega[k], onChange: e => setEntrega({ ...entrega, [k]: e.target.checked }) }), texto)
  return h('section', { 'aria-label': 'Tijera · vista previa', style: caja }, titulo,
    r?.ok
      ? h('span', null, `Área nueva dentro de «${r.baseNombre || 'el área'}». ${notas}`)
      : h('div', { role: 'alert', style: { color: '#ff9d9d' } }, r?.error || 'No se pudo cortar.'),
    h('small', { style: { color: '#b9c6da' } }, 'En la carta: celeste, lo que se corta; punteado blanco, las otras zonas; naranja, por donde pasó la tijera. Toque una zona para sumarla o quitarla.'),
    r?.ok && h('div', { style: { display: 'grid', gap: 4 } },
      casilla('contenido', 'Todo lo que se ve adentro (límites, puntos, fichas, CMOC, calcos…)'),
      entrega.contenido && casilla('enemigo', 'También las fichas enemigas'),
      entrega.contenido && casilla('cmoc', 'También el CMOC que está a la vista'),
      h('small', null, `Lleva: ${resumen || 'nada más que el contorno'}.`)),
    r?.ok && h('label', null, 'Nombre de la selección',
      h('input', { value: nombre, maxLength: 160, style: { ...boton, cursor: 'text', boxSizing: 'border-box' }, onChange: e => { tocado.current = true; setNombre(e.target.value) }, onKeyDown: e => { if (e.key === 'Enter') guardar() } })),
    ...mensajes,
    r?.ok && h('button', { type: 'button', style: verde, disabled: !nombre.trim() || !!pendiente, onClick: guardar }, pendiente ? '⏳ Guardando…' : '✓ Cortar y guardar selección'),
    h('button', { type: 'button', style: boton, onClick: empezar }, '↺ Volver a trazar'),
    quitar)
}
