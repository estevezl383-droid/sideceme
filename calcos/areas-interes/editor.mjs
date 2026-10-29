import { listarAreas } from './modelo.mjs?v=20261028-vista'
import { BotonOjo } from '../visibilidad/v1/panel.mjs?v=20261028'

function NombreArea({ react: R, area, indice, bloqueado, onNombre }) {
  const [texto, setTexto] = R.useState(area.nombre)
  R.useEffect(() => setTexto(area.nombre), [area.nombre])
  const guardar = () => {
    const valor = texto.trim() || area.nombre
    setTexto(valor)
    if (valor !== area.nombre) onNombre(area.id, valor)
  }
  return R.createElement('input', { 'aria-label': `Nombre del Área de Interés ${indice + 1}`, value: texto, maxLength: 100, disabled: bloqueado,
    style: { minWidth: 0, width: '100%', flex: 1, padding: 7, background: '#111b2a', color: '#e8edf5', border: '1px solid #526078', borderRadius: 4 },
    onChange: e => setTexto(e.target.value), onBlur: guardar, onKeyDown: e => { if (e.key === 'Enter') e.currentTarget.blur() } })
}

export default function AreasInteres({ react: R, aoi, onNueva, onQuitar, onNombre, verCapa = {}, onVerArea, bloqueado = false }) {
  const h = R.createElement, areas = listarAreas(aoi)
  return h('div', { style: { display: 'grid', gap: 8, marginBottom: 10 } },
    h('strong', { role: 'status' }, `${areas.length} ${areas.length === 1 ? 'área de interés' : 'áreas de interés'}`),
    h('small', null, 'Puedes mantener cinco o más áreas a la vez. Generar calcos analiza todas, sin incluir el terreno que queda entre ellas.'),
    ...areas.map((area, i) => h('div', { key: area.id, style: { display: 'flex', gap: 5, alignItems: 'center' } },
      h(BotonOjo, { react: R, nombre: area.nombre, visible: verCapa.areaInteres !== false && verCapa[`areaInteres:${area.id}`] !== false, onClick: () => onVerArea(area.id) }),
      h(NombreArea, { react: R, area, indice: i, bloqueado, onNombre }),
      h('button', { type: 'button', className: 'btn-mini', disabled: bloqueado, 'aria-label': `Quitar ${area.nombre}`,
        onClick: () => { if (globalThis.confirm(`¿Quitar «${area.nombre}»? Las demás áreas se conservan.`)) onQuitar(area.id) } }, '✕'))),
    h('button', { type: 'button', className: 'btn-tool', disabled: bloqueado, onClick: onNueva }, areas.length ? '＋ Dibujar otra área de interés' : '＋ Dibujar un área de interés'))
}
