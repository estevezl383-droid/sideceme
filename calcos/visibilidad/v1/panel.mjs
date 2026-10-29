import { listarAreas } from '../../areas-interes/modelo.mjs?v=20261028-vista'

export function establecerGrupo(actual, claves, mostrar) {
  const nuevas = { ...actual }
  for (const clave of new Set([...claves, ...Object.keys(actual).filter(k => claves.some(c => k.startsWith(`${c}:`)))])) nuevas[clave] = mostrar
  return nuevas
}

export function alternarArea(actual, areas, id) {
  const clave = `areaInteres:${id}`
  const mostrar = actual.areaInteres === false || actual[clave] === false
  const nuevas = actual.areaInteres === false ? establecerGrupo(actual, areas.map(a => `areaInteres:${a.id}`), false) : { ...actual }
  nuevas[clave] = mostrar
  nuevas.areaInteres = areas.some(a => nuevas[`areaInteres:${a.id}`] !== false)
  return nuevas
}

export function sumarAviso(actual, aviso) {
  return [...new Set([actual, aviso].filter(Boolean).flatMap(t => String(t).split(' · ')).map(t => t.trim()).filter(Boolean))].join(' · ')
}

export function BotonOjo({ react: R, visible, nombre, onClick, disabled = false }) {
  const h = R.createElement
  return h('button', { type: 'button', disabled, 'aria-pressed': visible,
    'aria-label': `${visible ? 'Ocultar' : 'Mostrar'} ${nombre}`, title: `${visible ? 'Ocultar' : 'Mostrar'} ${nombre}`,
    onClick, style: { flex: '0 0 34px', width: 34, padding: 5, display: 'grid', placeItems: 'center', cursor: 'pointer',
      background: visible ? '#14373c' : '#101b27', color: visible ? '#5ce1ff' : '#9daab9', border: '1px solid #344c5a', borderRadius: 5 } },
    h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true },
      h('path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z' }),
      h('circle', { cx: 12, cy: 12, r: 3 }), !visible && h('path', { d: 'M3 3 21 21', strokeWidth: 2.3 })))
}

export function CabeceraGrupo({ react: R, nombre, abierto, onPlegar, encendidos, total, onVisibilidad, visible = encendidos > 0 }) {
  const h = R.createElement
  return h('div', { style: { display: 'flex', gap: 5, alignItems: 'stretch' } },
    h('button', { type: 'button', className: 'ver-cab', style: { flex: 1, minWidth: 0 },
      'aria-expanded': abierto, 'aria-label': nombre, onClick: onPlegar, title: 'Plegar o desplegar los controles del grupo' },
      h('span', { className: 'ver-flecha', 'aria-hidden': true }, abierto ? '▾' : '▸'),
      h('span', { className: 'ver-cab-nom' }, nombre),
      h('span', { className: 'ver-cab-n' }, total === undefined ? encendidos : `${encendidos}/${total}`)),
    h(BotonOjo, { react: R, nombre: `el grupo ${nombre}`, visible, onClick: () => onVisibilidad(!visible) }))
}

export function PanelAreas({ react: R, children, aoi, verCapa, onTodas, dibujando }) {
  const h = R.createElement, [abierto, setAbierto] = R.useState(false)
  R.useEffect(() => { if (dibujando) setAbierto(true) }, [dibujando])
  const areas = listarAreas(aoi)
  const visibles = verCapa.areaInteres === false ? 0 : areas.filter(a => verCapa[`areaInteres:${a.id}`] !== false).length
  return h('section', { className: 'bloque', 'aria-label': 'Áreas de Interés' },
    h('h2', null, h(CabeceraGrupo, { react: R, nombre: '2 · Áreas de Interés', abierto, onPlegar: () => setAbierto(!abierto),
      encendidos: visibles, total: areas.length, onVisibilidad: onTodas })),
    abierto && h('div', { style: { marginTop: 8 } }, children))
}
