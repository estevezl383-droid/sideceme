// El PLANEAMIENTO NUMÉRICO del G-4 sobre el calco: cuánta gente, cuántos vehículos y qué
// armas tiene cada unidad apoyada (también una Fuerza de Tarea, sumando sus piezas), cuánto
// consume por día de cada clase según la operación (defensa, ataque…), cuánto tiene que
// mover cada instalación, cuántos camiones / cisternas / ambulancias hacen falta, cuántos
// viajes y con qué frecuencia.
//
// OJO — de dónde salen los números:
//   · La operación, las distancias, la DMA (TD, TC, V) y qué instalación apoya a quién salen
//     del calco y de los textos de la Escuela (doctrina.js).
//   · Los consumos por hombre / vehículo / arma, las dotaciones de cada tipo de unidad y las
//     capacidades de los vehículos NO están en los tres textos de la Escuela que tiene la
//     Mesa: son FACTORES DE REFERENCIA de la Mesa, EDITABLES (⚙ Factores del tablero) y se
//     guardan con el ejercicio. Los multiplicadores por operación siguen lo que dice la
//     lámina «Apoyo a las principales operaciones» (en la defensa sube la Clase IV y la V;
//     en el ataque la III, la V y la VIII; en la marcha la III…).
//   · Lo que el oficial pone para una unidad (efectivos, vehículos, armas) manda sobre la
//     estimación.
// Sin DOM: se prueba en Node.
import { operacionDeAO, operacion as operacionDoc, DMA_BASE, FUENTES } from './doctrina.js'
import { limpiar, centroide, distKm, puntoEnPoligono } from './geo.js'
import { unidadesApoyadas, nombreUnidad, nombreArea, claveArea } from './analisis.js'

export const AVISO_FACTORES =
  'Factores de REFERENCIA de la Mesa (editables en ⚙ Factores): los textos de la Escuela no traen consumos por hombre, dotaciones ni capacidades de vehículos. Reemplazalos por los de tu cátedra o del reglamento; la Mesa recalcula todo.'
export const FUENTE_OPERACION = `${FUENTES.dia}, «Apoyo a las principales operaciones» (qué clase sube en cada operación).`

// ─── Clases de abastecimiento ───────────────────────────────────────────────────────
export const CLASES = [
  { id: 'cl1', nom: 'Clase I · Víveres', corto: 'Cl I', color: '#199e70', base: 'hombre', unidad: 'kg/hombre/día' },
  { id: 'agua', nom: 'Agua', corto: 'Agua', color: '#3987e5', base: 'hombre', unidad: 'L/hombre/día', liquido: true },
  { id: 'cl2', nom: 'Clase II · Vestuario y equipo', corto: 'Cl II', color: '#8a96a8', otras: true, base: 'hombre', unidad: 'kg/hombre/día' },
  { id: 'cl3', nom: 'Clase III · Combustibles', corto: 'Cl III', color: '#c98500', base: 'vehiculo', unidad: 'L/vehículo/día', liquido: true },
  { id: 'cl4', nom: 'Clase IV · Fortificación', corto: 'Cl IV', color: '#9085e9', base: 'hombre', unidad: 'kg/hombre/día' },
  { id: 'cl5', nom: 'Clase V · Munición', corto: 'Cl V', color: '#d95926', base: 'arma', unidad: 'disparos × kg por arma' },
  { id: 'cl8', nom: 'Clase VIII · Sanidad', corto: 'Cl VIII', color: '#8a96a8', otras: true, base: 'hombre', unidad: 'kg/hombre/día' },
  { id: 'cl9', nom: 'Clase IX · Repuestos', corto: 'Cl IX', color: '#8a96a8', otras: true, base: 'vehiculo', unidad: 'kg/vehículo/día' },
]
// En los gráficos: cinco clases con su color (orden fijo) y las demás juntas en «Otras»
// (gris neutro). Validado para el fondo oscuro de la Mesa.
export const SERIES_CLASES = [
  { id: 'cl1', corto: 'Cl I', nom: 'Clase I · Víveres', color: '#199e70', clases: ['cl1'] },
  { id: 'agua', corto: 'Agua', nom: 'Agua', color: '#3987e5', clases: ['agua'] },
  { id: 'cl3', corto: 'Cl III', nom: 'Clase III · Combustibles', color: '#c98500', clases: ['cl3'] },
  { id: 'cl4', corto: 'Cl IV', nom: 'Clase IV · Fortificación', color: '#9085e9', clases: ['cl4'] },
  { id: 'cl5', corto: 'Cl V', nom: 'Clase V · Munición', color: '#d95926', clases: ['cl5'] },
  { id: 'otras', corto: 'Otras', nom: 'Otras (Cl II, VIII, IX)', color: '#8a96a8', clases: ['cl2', 'cl8', 'cl9'] },
]
export const claseDe = (id) => CLASES.find((c) => c.id === id) || null

export const VEHICULOS = [
  { id: 'liviano', nom: 'Livianos (jeep, camioneta)', corto: 'Liv.' },
  { id: 'camion', nom: 'Camiones', corto: 'Cam.' },
  { id: 'vci', nom: 'Blindados de transporte / VCI', corto: 'VCI' },
  { id: 'tanque', nom: 'Tanques', corto: 'Tq.' },
  { id: 'pieza', nom: 'Piezas autopropulsadas / tractores', corto: 'AP' },
]
export const ARMAS = [
  { id: 'portatil', nom: 'Armas portátiles (por combatiente)', corto: 'Portátiles' },
  { id: 'ametralladora', nom: 'Ametralladoras', corto: 'Ametr.' },
  { id: 'at', nom: 'Antitanque (misil / cañón SR)', corto: 'AT' },
  { id: 'mort81', nom: 'Mortero 81 mm', corto: 'Mort 81' },
  { id: 'mort120', nom: 'Mortero 120 mm', corto: 'Mort 120' },
  { id: 'tanque', nom: 'Cañón de tanque', corto: 'Tanque' },
  { id: 'art105', nom: 'Obús 105 mm', corto: 'Art 105' },
  { id: 'art155', nom: 'Obús 155 mm', corto: 'Art 155' },
  { id: 'aa', nom: 'Antiaérea', corto: 'AA' },
]
// Con qué vehículo se distribuye cada clase y en qué se mide su capacidad.
export const MEDIOS = [
  { id: 'carga', nom: 'Camión de carga', nomPlural: 'Camiones de carga', corto: 'camión', plural: 'camiones', icono: 'camion', color: '#d95926', unidadCap: 't' },
  { id: 'cisterna', nom: 'Cisterna de combustible', nomPlural: 'Cisternas de combustible', corto: 'cisterna', plural: 'cisternas', icono: 'cisterna', color: '#c98500', unidadCap: 'L' },
  { id: 'aguatero', nom: 'Cisterna de agua', nomPlural: 'Cisternas de agua', corto: 'aguatero', plural: 'aguateros', icono: 'cisterna', color: '#3987e5', unidadCap: 'L' },
  { id: 'ambulancia', nom: 'Ambulancia', nomPlural: 'Ambulancias', corto: 'ambulancia', plural: 'ambulancias', icono: 'ambulancia', color: '#d55181', unidadCap: 'heridos' },
  { id: 'grua', nom: 'Vehículo de recuperación (grúa)', nomPlural: 'Vehículos de recuperación (grúas)', corto: 'grúa', plural: 'grúas', icono: 'grua', color: '#9085e9', unidadCap: 'vehículos' },
  { id: 'personal', nom: 'Camión de personal', nomPlural: 'Camiones de personal', corto: 'cam. de personal', plural: 'cam. de personal', icono: 'camion', color: '#94a3b8', unidadCap: 'hombres' },
]
export const medioDe = (id) => MEDIOS.find((m) => m.id === id) || MEDIOS[0]
export const medioDeClase = (c) => (c === 'cl3' ? 'cisterna' : c === 'agua' ? 'aguatero' : 'carga')

export const OPERACIONES_PLAN = [
  { id: 'defensa', nom: 'Defensa' },
  { id: 'ataque', nom: 'Ataque' },
  { id: 'retrograda', nom: 'Operaciones retrógradas' },
  { id: 'marcha', nom: 'Marcha de aproximación' },
  { id: 'explotacion', nom: 'Explotación del éxito y persecución' },
  { id: 'reconocimiento', nom: 'Reconocimiento y seguridad' },
]

// ─── Factores de referencia (editables; se guardan en ops.planLog.factores) ────────
export const FACTORES_DEFECTO = {
  clases: { cl1: 2, agua: 20, cl2: 0.5, cl4: 1.5, cl8: 0.3, cl9: 4 },
  veh: { liviano: 40, camion: 80, vci: 150, tanque: 300, pieza: 120 },
  disparos: { portatil: 60, ametralladora: 600, at: 3, mort81: 60, mort120: 40, tanque: 25, art105: 80, art155: 60, aa: 100 },
  kgDisparo: { portatil: 0.025, ametralladora: 0.03, at: 30, mort81: 5, mort120: 18, tanque: 25, art105: 22, art155: 50, aa: 3 },
  medios: { carga: 5, cisterna: 5000, aguatero: 5000, ambulancia: 4, grua: 1, personal: 20 },
  transporte: { td: DMA_BASE.td, tc: DMA_BASE.tc, v: DMA_BASE.v, factor: 1.3, densidad: 0.8 },
  // Multiplicador de cada clase según la operación (1 = consumo normal) y tasas diarias.
  operacion: {
    defensa: { cl1: 1, agua: 1, cl2: 1, cl3: 0.7, cl4: 3, cl5: 1.3, cl8: 1.2, cl9: 0.8, heridos: 1, averias: 1.5 },
    ataque: { cl1: 1, agua: 1, cl2: 1, cl3: 1.2, cl4: 0.5, cl5: 1.5, cl8: 1.6, cl9: 1.2, heridos: 2.5, averias: 4 },
    retrograda: { cl1: 1, agua: 1, cl2: 1, cl3: 1.3, cl4: 0.8, cl5: 1, cl8: 1.2, cl9: 1, heridos: 1.5, averias: 3 },
    marcha: { cl1: 1, agua: 1, cl2: 1, cl3: 1.6, cl4: 0.2, cl5: 0.3, cl8: 0.6, cl9: 1.2, heridos: 0.2, averias: 3 },
    explotacion: { cl1: 1, agua: 1, cl2: 1, cl3: 1.7, cl4: 0.2, cl5: 1.1, cl8: 0.8, cl9: 1.3, heridos: 1, averias: 4 },
    reconocimiento: { cl1: 1, agua: 1, cl2: 1, cl3: 1.4, cl4: 0.2, cl5: 0.6, cl8: 0.8, cl9: 1, heridos: 0.5, averias: 2 },
  },
  sanidad: { muertosPorHerido: 0.25, remolcar: 0.3 },
}

// Las filas de la tabla «⚙ Factores» (ruta dentro de FACTORES_DEFECTO).
export const FILAS_FACTORES = [
  { grupo: 'Consumo por hombre y por día', filas: [
    { ruta: 'clases.cl1', nom: 'Clase I — ración', unidad: 'kg/hombre/día' },
    { ruta: 'clases.agua', nom: 'Agua', unidad: 'L/hombre/día' },
    { ruta: 'clases.cl2', nom: 'Clase II', unidad: 'kg/hombre/día' },
    { ruta: 'clases.cl4', nom: 'Clase IV — fortificación', unidad: 'kg/hombre/día' },
    { ruta: 'clases.cl8', nom: 'Clase VIII — sanidad', unidad: 'kg/hombre/día' },
    { ruta: 'clases.cl9', nom: 'Clase IX — repuestos', unidad: 'kg/vehículo/día' },
  ] },
  { grupo: 'Clase III — combustible por vehículo y por día', filas: VEHICULOS.map((v) => ({ ruta: `veh.${v.id}`, nom: v.nom, unidad: 'L/día' })) },
  { grupo: 'Clase V — disparos por arma y por día (consumo normal)', filas: ARMAS.map((a) => ({ ruta: `disparos.${a.id}`, nom: a.nom, unidad: 'disparos/día' })) },
  { grupo: 'Clase V — peso por disparo (con embalaje)', filas: ARMAS.map((a) => ({ ruta: `kgDisparo.${a.id}`, nom: a.nom, unidad: 'kg' })) },
  { grupo: 'Capacidad de los medios de transporte', filas: [
    { ruta: 'medios.carga', nom: 'Camión de carga', unidad: 't' },
    { ruta: 'medios.cisterna', nom: 'Cisterna de combustible', unidad: 'L' },
    { ruta: 'medios.aguatero', nom: 'Cisterna de agua', unidad: 'L' },
    { ruta: 'medios.ambulancia', nom: 'Ambulancia', unidad: 'heridos' },
    { ruta: 'medios.personal', nom: 'Camión de personal', unidad: 'hombres' },
  ] },
  { grupo: 'Transporte (los de la DMA)', filas: [
    { ruta: 'transporte.td', nom: 'TD — tiempo diario de operación del conductor', unidad: 'h' },
    { ruta: 'transporte.tc', nom: 'TC — carga, descarga y maniobra', unidad: 'h' },
    { ruta: 'transporte.v', nom: 'V — velocidad media nocturna', unidad: 'km/h' },
    { ruta: 'transporte.factor', nom: 'Carretera ≈ línea recta ×', unidad: '' },
    { ruta: 'transporte.densidad', nom: 'Densidad del combustible', unidad: 'kg/L' },
  ] },
  { grupo: 'Bajas y averías', filas: [
    { ruta: 'sanidad.muertosPorHerido', nom: 'Muertos por cada herido', unidad: '' },
    { ruta: 'sanidad.remolcar', nom: 'Averías que hay que remolcar', unidad: 'fracción' },
  ] },
]

// Dotación de referencia de un BATALLÓN de cada tipo (en el cuadro del PMTD un regimiento
// vale un batallón). `comb`: fracción de combatientes (armas portátiles).
export const PERFILES = {
  infanteria: { nom: 'Infantería', hombres: 600, comb: 0.75, veh: { liviano: 12, camion: 20 }, armas: { ametralladora: 24, at: 6, mort81: 6 } },
  mecanizada: { nom: 'Infantería mecanizada', hombres: 650, comb: 0.7, veh: { liviano: 10, camion: 20, vci: 44 }, armas: { ametralladora: 56, at: 9, mort81: 6, mort120: 4 } },
  blindada: { nom: 'Blindados (tanques)', hombres: 450, comb: 0.4, veh: { liviano: 10, camion: 25, vci: 6, tanque: 40 }, armas: { ametralladora: 60, tanque: 40, mort120: 4 } },
  caballeria: { nom: 'Caballería blindada', hombres: 500, comb: 0.6, veh: { liviano: 20, camion: 20, vci: 30 }, armas: { ametralladora: 40, at: 6, mort81: 6 } },
  artilleria: { nom: 'Artillería de campaña (105 mm)', hombres: 450, comb: 0.3, veh: { liviano: 15, camion: 40 }, armas: { art105: 18, ametralladora: 10 } },
  art155: { nom: 'Artillería 155 mm', hombres: 500, comb: 0.3, veh: { liviano: 15, camion: 45, pieza: 18 }, armas: { art155: 18, ametralladora: 10 } },
  morteros: { nom: 'Morteros pesados', hombres: 250, comb: 0.5, veh: { liviano: 10, camion: 15 }, armas: { mort120: 12, ametralladora: 6 } },
  antitanque: { nom: 'Antitanque', hombres: 300, comb: 0.6, veh: { liviano: 30, camion: 8 }, armas: { at: 18, ametralladora: 12 } },
  ingenieria: { nom: 'Ingeniería', hombres: 450, comb: 0.5, veh: { liviano: 10, camion: 45 }, armas: { ametralladora: 12 } },
  ada: { nom: 'Defensa antiaérea', hombres: 300, comb: 0.3, veh: { liviano: 10, camion: 25 }, armas: { aa: 18, ametralladora: 6 } },
  andina: { nom: 'Infantería de montaña', hombres: 600, comb: 0.8, veh: { liviano: 6, camion: 8 }, armas: { ametralladora: 24, mort81: 6, at: 6 } },
  aerotransportada: { nom: 'Infantería aerotransportada', hombres: 550, comb: 0.8, veh: { liviano: 8, camion: 6 }, armas: { ametralladora: 24, mort81: 6, at: 9 } },
  otras: { nom: 'Otras unidades', hombres: 400, comb: 0.4, veh: { liviano: 12, camion: 20 }, armas: { ametralladora: 10 } },
}
// Cuántos batallones vale cada escalón.
export const ESCALA = { equipo: 0.01, escuadra: 0.016, seccion: 0.06, compania: 0.22, batallon: 1, regimiento: 1, brigada: 3.5, division: 11, cuerpo: 30, ejercito: 80 }

const TIPO_DE_SIMBOLO = { blindaje: 'blindada', cab_blindada: 'caballeria', infanteria: 'infanteria', inf_ligera: 'infanteria', mediano: 'infanteria', inf_mecanizada: 'mecanizada', inf_montania: 'andina', inf_aerotransportada: 'aerotransportada', inf_asalto_aereo: 'aerotransportada', antitanque: 'antitanque', ingenieros: 'ingenieria', ada: 'ada', cab_antiaerea: 'ada', artilleria: 'artilleria', morteros: 'morteros' }
export function tipoDeUnidad(u) {
  const a = String(u?.arma || '').toLowerCase()
  const n = nombreUnidad(u)
  if (/blind|tanq/.test(a)) return 'blindada'
  if (/cabmec|caball/.test(a)) return 'caballeria'
  if (/mecan/.test(a)) return 'mecanizada'
  if (/artill|lanzacoh/.test(a)) return /155/.test(n) ? 'art155' : 'artilleria'
  if (/morter/.test(a)) return 'morteros'
  if (/antitanq/.test(a)) return 'antitanque'
  if (/ingenier/.test(a)) return 'ingenieria'
  if (/antiaer/.test(a)) return 'ada'
  if (/andin|monta/.test(a)) return 'andina'
  if (/aerotrans|asalto/.test(a)) return 'aerotransportada'
  if (/infant|motor|selva|ametrall/.test(a)) return 'infanteria'
  return 'otras'
}

// ─── Factores: los de referencia + lo que cambió el oficial ─────────────────────────
const esObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)
export function factores(over = {}) {
  const r = JSON.parse(JSON.stringify(FACTORES_DEFECTO))
  const mezclar = (a, b) => {
    if (!esObj(b)) return
    for (const [k, v] of Object.entries(b)) {
      if (!(k in a)) continue
      if (esObj(a[k])) mezclar(a[k], v)
      else if (Number.isFinite(+v) && +v >= 0 && v !== '' && v !== null) a[k] = +v
    }
  }
  mezclar(r, over)
  if (!(r.transporte.factor >= 1)) r.transporte.factor = 1
  return r
}
export function leerRuta(obj, ruta) {
  return String(ruta).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}
// Devuelve una copia de `over` con la ruta cambiada (valor vacío = volver al de referencia).
export function fijarRuta(over = {}, ruta, valor) {
  const r = JSON.parse(JSON.stringify(esObj(over) ? over : {}))
  const ks = String(ruta).split('.')
  let o = r
  for (const k of ks.slice(0, -1)) {
    if (!esObj(o[k])) o[k] = {}
    o = o[k]
  }
  const ult = ks[ks.length - 1]
  if (valor === '' || valor === null || valor === undefined || !Number.isFinite(+valor)) {
    delete o[ult]
    // Sin ramas vacías.
    for (let i = ks.length - 1; i > 0; i--) {
      const padre = leerRuta(r, ks.slice(0, i - 1).join('.')) ?? r
      const hijo = ks.slice(0, i).reduce((x, k) => x?.[k], r)
      if (esObj(hijo) && !Object.keys(hijo).length) delete (i === 1 ? r : padre)[ks[i - 1]]
    }
  } else o[ult] = +valor
  return r
}
export const rutaCambiada = (over, ruta) => leerRuta(over, ruta) !== undefined

// ─── Perfil de una unidad (gente, vehículos, armas) ────────────────────────────────
const sumar = (a, b, f = 1) => {
  for (const [k, v] of Object.entries(b || {})) a[k] = (a[k] || 0) + v * f
  return a
}
const redondear = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]).filter(([, v]) => v > 0))
export const ESCALONES = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']

export function composicionDe(u) {
  const piezas = Array.isArray(u?.piezasAg) ? u.piezasAg.filter(Boolean) : []
  if (piezas.length) {
    const grupos = new Map()
    for (const p of piezas) {
      const tipo = TIPO_DE_SIMBOLO[p.simbolo] || 'otras'
      const escalon = ESCALA[p.escalon] ? p.escalon : 'compania'
      const k = `${tipo}|${escalon}`
      grupos.set(k, { tipo, escalon, n: (grupos.get(k)?.n || 0) + 1 })
    }
    return [...grupos.values()]
  }
  return [{ tipo: tipoDeUnidad(u), escalon: ESCALA[u?.escalon] ? u.escalon : 'batallon', n: 1 }]
}
export function perfilUnidad(u) {
  const comp = composicionDe(u)
  let hombres = 0
  let comb = 0
  const veh = {}
  const armas = {}
  for (const c of comp) {
    const P = PERFILES[c.tipo] || PERFILES.otras
    const f = (ESCALA[c.escalon] || 1) * c.n
    hombres += P.hombres * f
    comb += P.hombres * P.comb * f
    sumar(veh, P.veh, f)
    sumar(armas, P.armas, f)
  }
  const est = { hombres: Math.round(hombres), veh: redondear(veh), armas: redondear(armas) }
  est.armas.portatil = Math.round(comb)
  // Lo que puso el oficial manda; si sólo cambió los efectivos, lo demás se escala.
  const o = esObj(u?.logDatos) ? u.logDatos : {}
  const h = Number.isFinite(+o.hombres) && +o.hombres > 0 ? Math.round(+o.hombres) : null
  const k = h && est.hombres ? h / est.hombres : 1
  const escalar = (base, dad) => {
    const r = {}
    for (const key of new Set([...Object.keys(base), ...Object.keys(esObj(dad) ? dad : {})])) {
      const v = esObj(dad) && Number.isFinite(+dad[key]) && dad[key] !== '' && dad[key] !== null ? Math.max(0, Math.round(+dad[key])) : Math.round((base[key] || 0) * k)
      if (v > 0) r[key] = v
    }
    return r
  }
  const vehF = escalar(est.veh, o.veh)
  const armasF = escalar(est.armas, o.armas)
  const cambiado = !!h || Object.keys(esObj(o.veh) ? o.veh : {}).length > 0 || Object.keys(esObj(o.armas) ? o.armas : {}).length > 0
  return {
    hombres: h ?? est.hombres,
    veh: vehF,
    armas: armasF,
    vehTotal: Object.values(vehF).reduce((s, x) => s + x, 0),
    composicion: comp.map((c) => ({ ...c, nom: (PERFILES[c.tipo] || PERFILES.otras).nom })),
    estimado: !cambiado,
    estimacion: est,
    esFT: !!(u?.esFT || u?.esAgrupacion || (Array.isArray(u?.piezasAg) && u.piezasAg.length)),
  }
}

// ─── Requerimientos diarios de una unidad ──────────────────────────────────────────
export function requerimientos(perfil, op = 'defensa', F = factores()) {
  const m = F.operacion[op] || F.operacion.defensa
  const r = {}
  const H = perfil.hombres
  const kgHombre = (c) => H * F.clases[c] * (m[c] ?? 1)
  r.cl1 = { kg: kgHombre('cl1') }
  r.agua = { l: H * F.clases.agua * (m.agua ?? 1) }
  r.agua.kg = r.agua.l
  r.cl2 = { kg: kgHombre('cl2') }
  let litros = 0
  const porVeh = []
  for (const v of VEHICULOS) {
    const n = perfil.veh[v.id] || 0
    if (!n) continue
    const l = n * F.veh[v.id] * (m.cl3 ?? 1)
    porVeh.push({ id: v.id, nom: v.nom, n, l })
    litros += l
  }
  r.cl3 = { l: litros, kg: litros * F.transporte.densidad, porVeh }
  r.cl4 = { kg: kgHombre('cl4') }
  const porArma = []
  let kg5 = 0
  for (const a of ARMAS) {
    const n = perfil.armas[a.id] || 0
    if (!n) continue
    const disp = n * F.disparos[a.id] * (m.cl5 ?? 1)
    const kg = disp * F.kgDisparo[a.id]
    porArma.push({ id: a.id, nom: a.nom, corto: a.corto, n, disparos: disp, kg })
    kg5 += kg
  }
  r.cl5 = { kg: kg5, porArma }
  r.cl8 = { kg: kgHombre('cl8') }
  r.cl9 = { kg: perfil.vehTotal * F.clases.cl9 * (m.cl9 ?? 1) }
  for (const c of Object.values(r)) c.t = c.kg / 1000
  return r
}

// ─── Qué maneja cada instalación ───────────────────────────────────────────────────
const CLASE_CATALOGO = { I: 'cl1', II: 'cl2', III: 'cl3', IV: 'cl4', V: 'cl5', VIII: 'cl8', IX: 'cl9' }
export function modoInstalacion(info = {}) {
  const g = info.grupo
  if (g === 'sanidad') return 'sanidad'
  if (g === 'mant') return 'mant'
  if (g === 'personal' || g === 'ac') return 'personal'
  if (g === 'abast' || g === 'agua') return 'abast'
  return 'general'
}
export function clasesDeInstalacion(info = {}) {
  const modo = modoInstalacion(info)
  if (info.grupo === 'agua') return ['agua']
  if (info.id === 'pd_forraje') return []
  if (modo === 'sanidad') return ['cl8']
  if (modo === 'mant') return ['cl9']
  if (modo === 'personal') return []
  if (modo === 'general') return CLASES.map((c) => c.id)
  const cs = [...new Set((info.clases || []).map((c) => CLASE_CATALOGO[c]).filter(Boolean))]
  return cs.length ? cs : CLASES.map((c) => c.id)
}

// ─── A quién apoya una instalación ──────────────────────────────────────────────────
const TRENES = ['at', 'atcamp', 'atcomb', 'atsu']
const posicion = (u) => (Number.isFinite(+u?.lng) && Number.isFinite(+u?.lat) ? [+u.lng, +u.lat] : null)
export { posicion }

// Las unidades que pueden recibir apoyo: las propias de combate / apoyo de combate, sin
// las que ya están adentro de una agrupación (la FT las cuenta en sus piezas).
export function unidadesQueReciben(unidades = []) {
  const absorbidas = new Set()
  for (const u of unidades || []) for (const p of Array.isArray(u?.piezasAg) ? u.piezasAg : []) if (p?.de) absorbidas.add(String(p.de))
  return unidadesApoyadas(unidades).filter((u) => !absorbidas.has(String(u.id)) && !u.futura)
}
export function zonaDeInstalacion(inst, ops = {}) {
  const zs = ops?.zonasLog || []
  const p = posicion(inst)
  for (const [i, z] of zs.entries()) {
    const c = limpiar(z.coords)
    if (c.length < 3) continue
    if ((inst?.areaLog && (inst.areaLog === z.clave || inst.areaLog === claveArea(z, i))) || (p && puntoEnPoligono(p, c))) return { z, i, nombre: nombreArea(z, i) }
  }
  return null
}
export function apoyadasDe(inst, calco = {}, info = {}) {
  const todas = unidadesQueReciben(calco.unidades)
  if (Array.isArray(inst?.apoyaA)) {
    const set = new Set(inst.apoyaA.map(String))
    return { unidades: todas.filter((u) => set.has(String(u.id))), modo: 'oficial', motivo: 'Las eligió el oficial.' }
  }
  const zona = zonaDeInstalacion(inst, calco.ops)
  const p = posicion(inst)
  const masCercana = (ref) => (ref && todas.length ? todas.map((u) => ({ u, d: distKm(ref, posicion(u)) })).sort((a, b) => a.d - b.d)[0].u : null)
  if (zona && TRENES.includes(zona.z.zona)) {
    const u = masCercana(centroide(zona.z.coords))
    return { unidades: u ? [u] : [], modo: 'auto', motivo: `Está en ${zona.nombre} (área de trenes): apoya a la unidad de esa área${u ? ` — ${nombreUnidad(u)}` : ''}.` }
  }
  if (['bon', 'su'].includes(info?.nivel)) {
    const u = masCercana(p)
    return { unidades: u ? [u] : [], modo: 'auto', motivo: `Es un puesto de nivel ${info.nivel === 'su' ? 'subunidad' : 'unidad'}: apoya a la unidad más cercana${u ? ` — ${nombreUnidad(u)}` : ''}.` }
  }
  return { unidades: todas, modo: 'auto', motivo: `Es un puesto de la GU${zona ? ` en ${zona.nombre}` : ''}: apoya a todas las unidades propias del calco (sin las de servicio).` }
}

// ─── El plan de una instalación ────────────────────────────────────────────────────
export function operacionDelCalco(calco = {}, plan = {}) {
  const elegida = OPERACIONES_PLAN.find((o) => o.id === plan?.operacion)
  if (elegida) return { id: elegida.id, nom: elegida.nom, fuente: 'la eligió el oficial' }
  const id = operacionDeAO(calco.ops?.areaOps) || 'defensa'
  const o = OPERACIONES_PLAN.find((x) => x.id === id) || OPERACIONES_PLAN[0]
  return { id: o.id, nom: o.nom, fuente: operacionDeAO(calco.ops?.areaOps) ? `el Área de Operaciones (${calco.ops.areaOps.tipo})` : 'sin tipo de operación en el Área de Operaciones: se supone defensa' }
}
// La modalidad de distribución: la del concepto de apoyo (fase activa o primera) o la del tablero.
export function modalidadDe(calco = {}, tablero = {}) {
  if (['propia', 'domicilio', 'mixto'].includes(tablero?.modalidad)) return tablero.modalidad
  const c = (calco.conceptoApoyo || []).find((x) => x?.distribucion)
  return ['propia', 'domicilio', 'mixto'].includes(c?.distribucion) ? c.distribucion : 'domicilio'
}
export const MODALIDADES = [
  { id: 'domicilio', nom: 'A domicilio', quien: 'Los vehículos de la instalación van a la unidad.' },
  { id: 'propia', nom: 'Por cuenta propia', quien: 'Los vehículos de la unidad vienen a la instalación.' },
  { id: 'mixto', nom: 'Mixta', quien: 'Una parte la retira la unidad y otra se entrega.' },
]

const ceil = (x) => (x > 0 ? Math.ceil(x - 1e-9) : 0)
export function cicloDe(km, F) {
  const T = F.transporte
  const carretera = km * T.factor
  const horas = T.tc + (2 * carretera) / Math.max(1, T.v)
  const viajes = Math.floor((T.td + 1e-9) / horas)
  return { carretera, horas, viajes, ida: carretera / Math.max(1, T.v), tc: T.tc, td: T.td }
}

export function planInstalacion(inst, calco = {}, { info = {}, plan = {}, tablero = {} } = {}) {
  const F = factores(plan?.factores)
  const op = operacionDelCalco(calco, plan)
  const m = F.operacion[op.id]
  const modo = modoInstalacion(info)
  const clases = clasesDeInstalacion(info)
  const apoyo = apoyadasDe(inst, calco, info)
  const frec = [12, 24, 48, 72].includes(+tablero?.frecuenciaH) ? +tablero.frecuenciaH : 24
  const p = posicion(inst)
  const avisos = []
  if (!p) avisos.push('La instalación no tiene posición en la carta.')
  const filas = apoyo.unidades.map((u) => {
    const perfil = perfilUnidad(u)
    const km = p && posicion(u) ? distKm(p, posicion(u)) : NaN
    const ciclo = cicloDe(Number.isFinite(km) ? km : 0, F)
    const req = requerimientos(perfil, op.id, F)
    const t = clases.reduce((s, c) => s + (req[c]?.t || 0), 0)
    // Cuántos viajes por día de cada medio (con la frecuencia de entrega).
    const porMedio = {}
    const add = (medio, cantidad, cap, unidad) => {
      if (!(cantidad > 0)) return
      const porEntrega = cantidad * (frec / 24)
      const viajesEntrega = ceil(porEntrega / Math.max(1e-9, cap))
      const viajesDia = (viajesEntrega * 24) / frec
      const x = porMedio[medio] || { cantidad: 0, unidad, viajesEntrega: 0, viajesDia: 0 }
      x.cantidad += cantidad
      x.viajesEntrega += viajesEntrega
      x.viajesDia += viajesDia
      porMedio[medio] = x
    }
    if (modo === 'abast' || modo === 'general') {
      for (const c of clases) {
        const md = medioDeClase(c)
        if (md === 'carga') add('carga', req[c].t, F.medios.carga, 't')
        else add(md, req[c].l, F.medios[md], 'L')
      }
    }
    const heridos = (perfil.hombres * (m.heridos || 0)) / 100
    const muertos = heridos * F.sanidad.muertosPorHerido
    const averias = (perfil.vehTotal * (m.averias || 0)) / 100
    if (modo === 'sanidad') {
      add('ambulancia', heridos, F.medios.ambulancia, 'heridos')
      add('carga', req.cl8.t, F.medios.carga, 't')
    }
    if (modo === 'mant') {
      add('grua', averias * F.sanidad.remolcar, F.medios.grua, 'vehículos')
      add('carga', req.cl9.t, F.medios.carga, 't')
    }
    if (modo === 'personal') add('personal', heridos + muertos, F.medios.personal, 'hombres')
    return { u, id: u.id, nombre: nombreUnidad(u), perfil, km, ciclo, req, t, porMedio, heridos, muertos, averias, dentro: ciclo.viajes >= 1 }
  })
  // Totales y flota: vehículo-horas / TD (cada unidad tiene su propio ciclo).
  const tot = { hombres: 0, vehiculos: 0, t: 0, porClase: {}, heridos: 0, muertos: 0, averias: 0, municion: {} }
  const flota = {}
  for (const f of filas) {
    tot.hombres += f.perfil.hombres
    tot.vehiculos += f.perfil.vehTotal
    tot.t += f.t
    tot.heridos += f.heridos
    tot.muertos += f.muertos
    tot.averias += f.averias
    for (const c of CLASES) tot.porClase[c.id] = (tot.porClase[c.id] || 0) + (f.req[c.id]?.t || 0)
    for (const a of f.req.cl5.porArma) {
      const x = tot.municion[a.id] || { id: a.id, nom: a.nom, corto: a.corto, n: 0, disparos: 0, kg: 0 }
      x.n += a.n
      x.disparos += a.disparos
      x.kg += a.kg
      tot.municion[a.id] = x
    }
    for (const [md, x] of Object.entries(f.porMedio)) {
      const fl = flota[md] || { id: md, ...medioDe(md), cantidad: 0, unidad: x.unidad, viajesDia: 0, horas: 0, fuera: [] }
      fl.cantidad += x.cantidad
      fl.viajesDia += x.viajesDia
      fl.horas += x.viajesDia * f.ciclo.horas
      if (!f.dentro) fl.fuera.push(f.nombre)
      flota[md] = fl
    }
  }
  for (const fl of Object.values(flota)) {
    fl.vehiculos = ceil(fl.horas / F.transporte.td)
    fl.cap = F.medios[fl.id]
  }
  tot.municion = Object.values(tot.municion).sort((a, b) => b.kg - a.kg)
  for (const f of filas) if (!f.dentro) avisos.push(`${f.nombre}: el ciclo de ida y vuelta (${f.ciclo.horas.toFixed(1)} h) supera el TD de ${F.transporte.td} h — queda fuera de la distancia máxima de apoyo.`)
  if (!filas.length) avisos.push('No hay unidades propias para apoyar: colocá las fichas (o elegí a quién apoya esta instalación).')
  return {
    inst: { id: inst?.id, nombre: String(inst?.designacion || info?.nom || 'Instalación'), tipo: info?.nom || inst?.instalacion || '', grupo: info?.grupo || '', nivel: info?.nivel || '' },
    modo,
    clases,
    operacion: op,
    opDoc: operacionDoc(op.id),
    apoyo: { modo: apoyo.modo, motivo: apoyo.motivo },
    frecuenciaH: frec,
    modalidad: modalidadDe(calco, tablero),
    filas,
    totales: tot,
    flota: Object.values(flota).sort((a, b) => b.vehiculos - a.vehiculos),
    factores: F,
    avisos,
    zona: zonaDeInstalacion(inst, calco.ops)?.nombre || '',
  }
}

// ─── Números para mostrar ──────────────────────────────────────────────────────────
export const fmtN = (x, dec = 0) => (Number.isFinite(x) ? (Math.round(x * 10 ** dec) / 10 ** dec).toLocaleString('es') : '—')
export const fmtT = (t) => (!Number.isFinite(t) ? '—' : t >= 10 ? `${fmtN(t, 0)} t` : t >= 1 ? `${fmtN(t, 1)} t` : `${fmtN(t * 1000, 0)} kg`)
export const fmtL = (l) => (!Number.isFinite(l) ? '—' : l >= 10000 ? `${fmtN(l / 1000, 0)} m³` : `${fmtN(l, 0)} L`)
export const fmtCant = (x, unidad) => (unidad === 't' ? fmtT(x) : unidad === 'L' ? fmtL(x) : `${fmtN(x, x < 10 ? 1 : 0)} ${unidad}`)
export const fmtFrec = (h) => (h === 24 ? 'cada 24 h (diaria)' : h < 24 ? `cada ${h} h (${24 / h} por día)` : `cada ${h} h (cada ${h / 24} días)`)

// Una línea por instalación (para el popup de la carta y la IA).
export function resumenCorto(plan) {
  const t = plan.totales
  const fl = plan.flota.map((x) => `${x.vehiculos} ${x.vehiculos === 1 ? x.corto : x.plural}`).join(', ')
  return `Apoya a ${plan.filas.length} unidad(es) · ${fmtN(t.hombres)} hombres · ${fmtN(t.vehiculos)} vehículos · ${plan.modo === 'sanidad' ? `${fmtN(t.heridos, 1)} heridos/día` : plan.modo === 'mant' ? `${fmtN(t.averias, 1)} averías/día` : plan.modo === 'personal' ? `${fmtN(t.heridos + t.muertos, 1)} bajas/día` : `${fmtT(t.t)}/día`}${fl ? ` · ${fl}` : ''} · ${fmtFrec(plan.frecuenciaH)}`
}

// Texto completo del plan (para el pedido a la IA).
export function textoPlan(plan) {
  const L = []
  const F = plan.factores
  L.push(`Instalación: ${plan.inst.nombre} (${plan.inst.tipo}; grupo ${plan.inst.grupo || '—'}; nivel ${plan.inst.nivel || '—'})${plan.zona ? ` — en ${plan.zona}` : ''}.`)
  L.push(`Operación: ${plan.operacion.nom} (${plan.operacion.fuente}). Modalidad de distribución: ${MODALIDADES.find((x) => x.id === plan.modalidad)?.nom}. Frecuencia de entrega: ${fmtFrec(plan.frecuenciaH)}.`)
  L.push(`Clases que maneja: ${plan.clases.map((c) => claseDe(c)?.nom).join(', ') || 'ninguna (apoyo de servicios)'}.`)
  L.push(`A quién apoya (${plan.apoyo.modo === 'oficial' ? 'lo eligió el oficial' : 'lo dedujo la Mesa'}): ${plan.apoyo.motivo}`)
  L.push(`Transporte: TD ${F.transporte.td} h, TC ${F.transporte.tc} h, V ${F.transporte.v} km/h, carretera ≈ recta × ${F.transporte.factor}.`)
  for (const f of plan.filas) {
    const P = f.perfil
    L.push(`- ${f.nombre}${P.esFT ? ' (Fuerza de Tarea / agrupación)' : ''}: ${fmtN(P.hombres)} hombres${P.estimado ? ' (estimado por la Mesa)' : ' (dato del oficial)'}; composición ${P.composicion.map((c) => `${c.n} × ${c.nom} (${c.escalon})`).join(', ')}; vehículos ${VEHICULOS.filter((v) => P.veh[v.id]).map((v) => `${P.veh[v.id]} ${v.corto}`).join(', ') || '—'}; armas ${ARMAS.filter((a) => P.armas[a.id]).map((a) => `${P.armas[a.id]} ${a.corto}`).join(', ') || '—'}.`)
    L.push(`  · Distancia ${fmtN(f.km, 1)} km en línea recta (≈ ${fmtN(f.ciclo.carretera, 1)} km por carretera); ciclo ida y vuelta ${fmtN(f.ciclo.horas, 1)} h; ${f.ciclo.viajes} viaje(s) por vehículo por jornada.`)
    L.push(`  · Consumo diario: ${CLASES.map((c) => `${c.corto} ${c.liquido ? fmtL(f.req[c.id].l) : fmtT(f.req[c.id].t)}`).join('; ')}.`)
    if (f.req.cl5.porArma.length) L.push(`  · Munición: ${f.req.cl5.porArma.map((a) => `${a.corto} ${fmtN(a.n)} armas × ${fmtN(a.disparos / a.n)} disp = ${fmtT(a.kg / 1000)}`).join('; ')}.`)
    for (const [md, x] of Object.entries(f.porMedio)) L.push(`  · ${medioDe(md).nom}: ${fmtCant(x.cantidad, x.unidad)}/día → ${fmtN(x.viajesEntrega)} viaje(s) por entrega.`)
    if (plan.modo === 'sanidad' || plan.modo === 'personal') L.push(`  · Bajas estimadas: ${fmtN(f.heridos, 1)} heridos/día y ${fmtN(f.muertos, 1)} muertos/día.`)
    if (plan.modo === 'mant') L.push(`  · Averías estimadas: ${fmtN(f.averias, 1)} vehículos/día.`)
  }
  L.push(`Totales: ${fmtN(plan.totales.hombres)} hombres, ${fmtN(plan.totales.vehiculos)} vehículos, ${fmtT(plan.totales.t)}/día de las clases que maneja la instalación.`)
  for (const fl of plan.flota) L.push(`Flota necesaria: ${fl.vehiculos} × ${fl.nom} (capacidad ${fmtN(fl.cap)} ${fl.unidadCap}), ${fmtN(fl.viajesDia, 1)} viajes/día, ${fmtN(fl.horas, 1)} horas-vehículo/día.`)
  for (const a of plan.avisos) L.push(`AVISO: ${a}`)
  return L.join('\n')
}
