// ✂️💾 Guardar el área cortada como EJERCICIO APARTE (08-11-2026).
//
// Lo pidió Sergio con la captura de la tijera sobre «AO TIGRE CE-I (TAMBO QUEMADO)» y la del botón
// «💾 Guardar como»: «lo cortado que lo pueda guardar… que me salga guardar área cortada como… y así yo
// ya pueda entregar su área y su enemigo a cada cuerpo de ejército… todo lo que está dentro del área
// cortada debe incluir sus unidades y todo lo que esté activado».
//
// La tijera ya guardaba la SELECCIÓN dentro del ejercicio abierto (▧ Área de Ops → «Selecciones
// guardadas») y la bajaba como Seleccion_….json, que se abría con 📁 Ejercicios → «📂 Abrir archivo».
// Acá se hace eso mismo sin archivo de por medio: el paquete de la selección (paqueteSeleccion: el
// área, lo que se veía adentro cortado por el lazo, las fichas propias y enemigas, el CMOC, los
// calcos del terreno) pasa por ejercicioDeArchivo y se GRABA como ejercicio nuevo con su nombre.
// El ejercicio abierto NO cambia ni se cierra: el nuevo queda en 📁 Ejercicios → «Abrir guardados».
//
// Usa el almacén de la Mesa que expone el compilado (window.SIDAlmacenMesa: listar/crear/guardar,
// index-cortada-20261108.js) y el ejercicio abierto (window.SIDMesaEjercicio.foto()).
import { listarSelecciones, paqueteSeleccion } from './modelo.mjs?v=tijera20261016'
import { ejercicioDeArchivo, nombreLibre } from './abrir-archivo.mjs?v=tijera20261016'

const CMOC_VACIO = { restringido: [], severo: [], clave: [], defensivo: [], ae: [], corredores: [], avenidas: [], desplazamientos: [] }
const limpiar = n => String(n || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 80)

// Las selecciones del ejercicio abierto (para el panel «💾 Guardar como»).
export function seleccionesAbiertas(w = globalThis) {
  try {
    const f = w.SIDMesaEjercicio?.foto?.()
    return f ? listarSelecciones(f.ops || {}).map(s => ({ id: s.id, nombre: s.nombre, guardada: s.guardada })) : []
  } catch { return [] }
}

// Los datos del ejercicio nuevo con la selección `id` del ejercicio abierto.
export function ejercicioDeSeleccion(foto, id, { ahora } = {}) {
  if (!foto) throw new Error('No hay un ejercicio abierto.')
  const sel = listarSelecciones(foto.ops || {}).find(s => s.id === id)
  if (!sel) throw new Error('La selección ya no está en el ejercicio (¿se deshizo?): vuelva a cortarla con ✂️.')
  const p = paqueteSeleccion(foto.ops || {}, sel, foto.nombre || '', { unidades: foto.unidades || [], cmoc: foto.cmoc || null, resultados: foto.resultados || null })
  const r = ejercicioDeArchivo(JSON.parse(JSON.stringify(p)), { archivo: '', opsVacias: {}, cmocVacio: CMOC_VACIO, ...(ahora ? { ahora } : {}) })
  if (!r.ok) throw new Error(r.error)
  // El país, las capas que se veían y el escenario del ejercicio de origen, para que se abra igual.
  const datos = { ...r.datos, ...(foto.pais ? { pais: foto.pais } : {}), ...(foto.capasVisibles ? { capasVisibles: foto.capasVisibles } : {}),
    ...(foto.escenario ? { escenario: foto.escenario } : {}), origenCorte: { ejercicio: foto.nombre || '', seleccion: sel.nombre, cortadoEn: ahora || new Date().toISOString() } }
  return { datos, nombre: sel.nombre, resumen: r.resumen }
}

// Pide el nombre y lo graba. Devuelve { ok, nombre, resumen } o { ok:false, error } o { cancelado }.
export async function guardarCortadaComo(id, { w = globalThis, preguntar = (m, d) => w.prompt(m, d) } = {}) {
  const alm = w.SIDAlmacenMesa
  if (!alm) return { ok: false, error: 'Esta versión de la Mesa no puede crear ejercicios desde acá: recargue la página.' }
  let e
  try { e = ejercicioDeSeleccion(w.SIDMesaEjercicio?.foto?.(), id) } catch (x) { return { ok: false, error: x.message } }
  const ls = await alm.listar()
  const existentes = Array.isArray(ls) ? ls.map(x => x.nombre) : []
  const abierto = w.SIDMesaEjercicio?.nombre?.() || ''
  const propuesto = nombreLibre(abierto ? `${e.nombre} · ${abierto}` : e.nombre, existentes)
  const n = preguntar(`Se guarda «${e.nombre}» como ejercicio APARTE (${e.resumen}).\nEl que tenés abierto no cambia.\n\nNombre del ejercicio nuevo:`, propuesto)
  if (n === null || !String(n).trim()) return { ok: true, cancelado: true }
  const nom = limpiar(n)
  if (existentes.some(x => String(x || '').toLowerCase() === nom.toLowerCase())) return { ok: false, error: `Ya existe un ejercicio llamado «${nom}»: elegí otro nombre.` }
  const c = await alm.crear(nom)
  if (c?.ok === false) return { ok: false, error: `No se creó «${nom}»: ${c.error || ''}` }
  const final = c?.nombre || nom
  const g = await alm.guardar(final, { ...e.datos, nombre: final })
  if (g?.ok === false) return { ok: false, error: `«${final}» se creó pero no se pudo guardar: ${g.error || ''}` }
  return { ok: true, nombre: final, resumen: e.resumen }
}
