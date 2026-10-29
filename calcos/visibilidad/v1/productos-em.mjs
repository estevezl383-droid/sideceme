import { BotonOjo, CabeceraGrupo } from './panel.mjs?v=20261028'

const zonas = ['zonasLog:asdi', 'zonasLog:arce', 'zonasLog:otras']
const g4 = [...zonas, 'g4:sectores', 'g4:epa', 'g4:epe', 'g4:instalaciones']
const g1 = ['g1:lineaExtraviados', 'g1:puestosExtraviados', 'g1:prisioneros', 'g1:rutaPrisioneros', 'g1:otrasInstalaciones']
const prisioneros = new Set(['p_ppgg', 'dpg', 'crpg', 'ccpg'])
const extraviados = new Set(['p_extrav', 'pce'])
const claveZona = z => `zonasLog:${['asdi', 'arce'].includes(z?.zona) ? z.zona : 'otras'}`
// Los cuatro servicios de la plantilla existente (lN). C y S figura aparte.
export const AREAS_INTERNAS = [
  {id:'sanidad',nombre:'Sanidad'}, {id:'abast',nombre:'Abastecimiento'},
  {id:'mant',nombre:'Mantenimiento'}, {id:'personal',nombre:'Personal'}
]
const cacheSectores = new WeakMap()

// Completa sólo la representación usando la geometría de la plantilla actual.
// Los sectores guardados quedan primero y conservan sus índices de edición.
export function sectoresRepresentados(ops = {}, crearSectores) {
  const guardados = ops.sectoresLog || []
  if (typeof crearSectores !== 'function') return guardados
  const cache = cacheSectores.get(ops)
  if (cache?.crear === crearSectores) return cache.sectores
  const agregados = []
  for (const z of ops.zonasLog || []) {
    if (!['asdi','arce'].includes(z.zona) || !Array.isArray(z.coords) || z.coords.length < 3) continue
    const faltan = AREAS_INTERNAS.map(a=>a.id).filter(id=>!guardados.some(s=>s.sector===id && areaDe(s,ops)===z))
    if (!faltan.length) continue
    try {
      const area = z.clave || z.zona.toUpperCase()
      const resultado = crearSectores(z.coords,{rumbo:z.rumbo||0,area,sectores:faltan})
      for (const s of resultado?.sectores || []) if (faltan.includes(s.sector) && s.coords?.length >= 3)
        agregados.push({...s,areaLog:area,soloVista:true})
    } catch { /* Un contorno inválido no modifica el ejercicio ni sus sectores guardados. */ }
  }
  const sectores = [...guardados,...agregados]
  cacheSectores.set(ops,{crear:crearSectores,sectores})
  return sectores
}

export function mostrarSoloAreas(ver = {}) {
  return {...ver,zonasLog:true,'zonasLog:asdi':true,'zonasLog:arce':true,'g4:sectores':true,'g4:instalaciones':false,
    ...(ver.zonasLog===false?{'zonasLog:otras':false}:{})}
}

export function productoEncendido(ver = {}, clave) {
  return ver[clave] !== false && (!zonas.includes(clave) || ver.zonasLog !== false)
}

// Encender un área con el maestro antiguo apagado enciende sólo esa clase.
export function cambiarProducto(ver = {}, clave, mostrar) {
  if (clave === 'g4:soloAreas') return mostrarSoloAreas(ver)
  const nuevo = { ...ver, [clave]: mostrar }
  if (mostrar && zonas.includes(clave) && ver.zonasLog === false) {
    for (const otra of zonas) nuevo[otra] = otra === clave
    nuevo.zonasLog = true
  }
  return nuevo
}

function areaDe(obj, ops) {
  if (!obj?.areaLog) return null
  return (ops?.zonasLog || []).find(z => (z.clave || String(z.zona || 'asdi').toUpperCase()) === obj.areaLog) || null
}

export function claveInstalacion(u, catalogo = []) {
  if (!u?.instalacion || /enemig/.test(u.bando || '')) return null
  const id = u.instalacion
  if (prisioneros.has(id)) return 'g1:prisioneros'
  if (extraviados.has(id)) return 'g1:puestosExtraviados'
  const grupo = catalogo.find(x => x.id === id)?.grupo
  if (grupo === 'personal') return 'g1:otrasInstalaciones'
  if (grupo === 'areas') return claveZona({ zona: id })
  return grupo && grupo !== 'ac' ? 'g4:instalaciones' : null
}

// Se consulta al dibujar cada objeto, conservando su índice original de edición.
export function productoVisible(categoria, obj, ver = {}, ops = {}) {
  if (categoria === 'zonasLog') return productoEncendido(ver, claveZona(obj))
  if (categoria === 'sectoresLog') {
    const area = areaDe(obj, ops)
    return ver['g4:sectores'] !== false && (!area || productoEncendido(ver, claveZona(area)))
  }
  if (categoria === 'ejesLog') return ver[obj.tipo === 'epe' ? 'g4:epe' : 'g4:epa'] !== false
  if (categoria === 'lineasEM') {
    if (obj.tipo === 'ppgg') return ver['g1:rutaPrisioneros'] !== false
    if (obj.tipo !== 'humanitario') return ver['g1:lineaExtraviados'] !== false
  }
  if (categoria === 'magnitudes' && String(obj.origen || '').startsWith('zona-')) {
    const area = (ops.zonasLog || []).find((z, i) => obj.origen === `zona-${z.clave || i}`)
    if (area) return productoEncendido(ver, claveZona(area))
  }
  return true
}

export function unidadesProductos(unidades = [], ops = {}, ver = {}, catalogo = []) {
  return unidades.filter(u => {
    const clave = claveInstalacion(u, catalogo)
    if (clave && !productoEncendido(ver, clave)) return false
    const area = /enemig/.test(u?.bando || '') ? null : areaDe(u, ops)
    if (area && u.instalacion && ver['g4:instalaciones'] === false) return false
    return !area || productoEncendido(ver, claveZona(area))
  })
}

export function productosDelEM(ops = {}, unidades = [], catalogo = [], crearSectores) {
  const n = Object.fromEntries([...g4, ...g1].map(k => [k, 0]))
  for (const z of ops.zonasLog || []) n[claveZona(z)]++
  const sectores = sectoresRepresentados(ops,crearSectores)
  n['g4:sectores'] = sectores.length
  for (const e of ops.ejesLog || []) n[e.tipo === 'epe' ? 'g4:epe' : 'g4:epa']++
  for (const l of ops.lineasEM || []) {
    if (l.tipo === 'ppgg') n['g1:rutaPrisioneros']++
    else if (l.tipo !== 'humanitario') n['g1:lineaExtraviados']++
  }
  for (const u of unidades) {
    const k = claveInstalacion(u, catalogo)
    if (k) n[k]++
    if (k !== 'g4:instalaciones' && u.instalacion && !/enemig/.test(u.bando||'') && areaDe(u,ops)) n['g4:instalaciones']++
  }
  const filas = xs => xs.filter(([k, , siempre]) => siempre || n[k]).map(([id, nombre]) => ({ id, nombre, cantidad: n[id] }))
  return [
    { id:'g4', nombre:'🚚 G-4 · Logística', orden:6, color:'#ffbd69', claves:['zonasLog', ...g4],
      hayAreas:(ops.zonasLog||[]).some(z=>['asdi','arce'].includes(z.zona)&&z.coords?.length>=3),
      esquema:sectores.some(s=>s.soloVista), filas:filas([
      ['zonasLog:asdi','ASDI',true], ['zonasLog:arce','ARCE',true], ['zonasLog:otras','Otras áreas logísticas'],
      ['g4:epa','Ejes de abastecimiento (EPA)',true], ['g4:epe','Ejes de evacuación (EPE)',true],
      ['g4:sectores','Áreas internas del ASDI/ARCE'], ['g4:instalaciones','Instalaciones logísticas']
    ]) },
    { id:'g1', nombre:'👥 G-1 · Personal', orden:7, color:'#d2b0ff', claves:g1, filas:filas([
      ['g1:lineaExtraviados','Línea de extraviados',true], ['g1:puestosExtraviados','Puestos de reunión y control de extraviados'],
      ['g1:prisioneros','Puestos y centros de reunión de prisioneros',true],
      ['g1:rutaPrisioneros','Rutas de evacuación de prisioneros'], ['g1:otrasInstalaciones','Otras instalaciones de personal']
    ]) }
  ]
}

function Grupo({ react:R, grupo, verCapa, onVer, onGrupo }) {
  const h = R.createElement, [abierto, setAbierto] = R.useState(false)
  return h('section', { className:'ver-bloque', 'aria-label':grupo.nombre, style:{order:grupo.orden,'--gc':grupo.color} },
    h(CabeceraGrupo, {react:R,nombre:grupo.nombre,abierto,onPlegar:()=>setAbierto(!abierto),
      encendidos:grupo.filas.filter(f=>productoEncendido(verCapa,f.id)).length,total:grupo.filas.length,
      onVisibilidad:mostrar=>onGrupo(grupo.claves,mostrar)}),
    abierto && h('div', {className:'ver-cuerpo',style:{display:'grid',gap:7}},
      grupo.id==='g4' && grupo.hayAreas && h(R.Fragment,null,
        h('button',{type:'button',onClick:()=>onVer('g4:soloAreas',true),style:{padding:'7px 8px',border:'1px solid #8b734c',borderRadius:5,background:'#292619',color:'#ffe0a3',cursor:'pointer',textAlign:'left'}},'Ver sólo áreas, sin instalaciones'),
        h('small',null,AREAS_INTERNAS.map(a=>a.nombre).join(' · ')),
        grupo.esquema && h('small',{style:{color:'#aebdcc'}},'Las áreas sin trazado guardado se muestran como esquema de la plantilla.')),
      ...grupo.filas.map(f=>h('div',{key:f.id,style:{display:'flex',gap:5,alignItems:'center'}},
        h('span',{style:{flex:1}},`${f.nombre} (${f.cantidad})`),
        h(BotonOjo,{react:R,nombre:f.nombre,visible:productoEncendido(verCapa,f.id),disabled:f.cantidad===0,
          onClick:()=>onVer(f.id,!productoEncendido(verCapa,f.id))}))),
      !grupo.filas.some(f=>f.cantidad) && h('small',null,'Sin elementos guardados en la carta actual.')))
}

export function ProductosEM({ react:R, ops, unidades, catalogo, crearSectores, verCapa, onVer, onGrupo }) {
  return R.createElement(R.Fragment,null,...productosDelEM(ops,unidades,catalogo,crearSectores).map(grupo=>
    R.createElement(Grupo,{key:grupo.id,react:R,grupo,verCapa,onVer,onGrupo})))
}
