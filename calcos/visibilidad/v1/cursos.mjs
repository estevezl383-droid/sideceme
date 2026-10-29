import { capsDe } from '../../cap-propios/v1/proponer.mjs'
import { BotonOjo, CabeceraGrupo } from './panel.mjs?v=20261028'
import { unidadesProductos } from './productos-em.mjs?v=20261029-g4-g1'

export function cursosEnemigos(fasesCOA = {}) {
  const cursos = [
    { id: 'probable', nombre: 'CAE más probable', color: '#ff9b80', fases: [] },
    { id: 'peligroso', nombre: 'CAE más peligroso', color: '#ff759e', fases: [] }
  ]
  ;(fasesCOA.enemigo || []).forEach((fase, idx) => {
    const curso = cursos[fase?.coa === 'peligroso' ? 1 : 0]
    curso.fases.push({ idx, fase, numero: fase?.n || curso.fases.length + 1 })
  })
  return cursos
}

export function cursosPropios(g3 = {}, fasesCOA = {}) {
  const caps = capsDe(g3)
  return [1, 2].map(n => ({
    n, nombre: `CAP ${n}`, activo: n === caps.activo,
    fases: (n === caps.activo ? fasesCOA.propio : caps.guardados[n]?.fases) || []
  }))
}

// Se filtra la representación, nunca el estado editable que se guarda.
export function vistaDelCurso(vista, activa, verCapa = {}, catalogo = []) {
  const enemigoOculto = !!activa && verCapa.cae === false
  const propioOculto = activa?.bando === 'propio' && verCapa.cap === false
  const faseOculta = propioOculto || (activa?.bando === 'enemigo' && enemigoOculto)
  const esEnemigo = u => /^(enemigo|enemigas)$/.test(u?.bando || '')
  const unidades = (vista.unidades || []).filter(u => !(enemigoOculto && esEnemigo(u)) && !(propioOculto && !esEnemigo(u)))
  let ops = vista.ops, cmoc = vista.cmoc
  if (faseOculta) {
    ops = { ...ops }
    for (const clave of ['tareas', 'tareasOcultas', 'maniobra', 'limites', 'flechasZona', 'objetivos']) ops[clave] = []
    if (activa?.bando === 'enemigo') { ops.obstaculos = []; ops.posDef = [] }
    cmoc = { ...cmoc, desplazamientos: [] }
  }
  if (verCapa.planBarreras === false && activa?.bando !== 'enemigo') ops = { ...ops, obstaculos: [], posDef: [] }
  return { ...vista, unidades: unidadesProductos(unidades,ops,verCapa,catalogo), ops, cmoc }
}

const boton = { width: '100%', padding: '6px 8px', border: '1px solid #3c5268', borderRadius: 5,
  background: '#101f2c', color: '#dbe9f2', textAlign: 'left', cursor: 'pointer', fontSize: 12 }

function Fase({ react: R, texto, activa, onClick }) {
  return R.createElement('button', { type: 'button', 'aria-pressed': activa, onClick,
    style: { ...boton, borderColor: activa ? '#5ce1ff' : '#3c5268', background: activa ? '#17404a' : '#101f2c' } }, texto)
}

export function CursosEnemigos({ react: R, fasesCOA, activa, verCapa, onFase, onVer, onAbrir }) {
  const h = R.createElement
  const elegir = (idx, visible) => {
    if (activa?.bando === 'enemigo' && activa.idx === idx) onVer('cae', !visible)
    else onFase('enemigo', idx)
  }
  return h('div', { role: 'group', 'aria-label': 'Cursos de acción del enemigo', style: { display: 'grid', gap: 8, marginTop: 8 } },
    h('strong', null, 'Cursos de acción del enemigo'),
    h('small', null, 'Elige una fase para verla en la carta. Se muestra una fase a la vez.'),
    ...cursosEnemigos(fasesCOA).map(curso => {
      const seleccionada = curso.fases.find(f => activa?.bando === 'enemigo' && activa.idx === f.idx)
      const visible = !!seleccionada && verCapa.cae !== false
      return h('section', { key: curso.id, 'aria-label': curso.nombre, style: { display: 'grid', gap: 5, padding: 7, border: `1px solid ${curso.color}`, borderRadius: 6 } },
        h('div', { style: { display: 'flex', gap: 5, alignItems: 'center' } },
          h('strong', { style: { flex: 1, fontSize: 12, color: curso.color } }, curso.nombre),
          h(BotonOjo, { react: R, nombre: curso.nombre, visible, disabled: !curso.fases.length,
            onClick: () => elegir(seleccionada?.idx ?? curso.fases[0].idx, visible) })),
        ...curso.fases.map(({ idx, fase, numero }) => h(Fase, { key: idx, react: R,
          texto: `Fase ${numero}${fase?.nombre ? ` · ${fase.nombre}` : ''}`, activa: visible && seleccionada.idx === idx,
          onClick: () => elegir(idx, visible && seleccionada?.idx === idx) })),
        !curso.fases.length && h('small', null, 'Sin fases guardadas.'))
    }),
    h('button', { type: 'button', style: boton, onClick: onAbrir }, '🎬 Abrir C.A. por fases'))
}

export function CursosPropios({ react: R, fasesCOA, g3, activa, verCapa, onFase, onVer, onGrupo, onAbrir, planFuegos, ops }) {
  const h = R.createElement, [abierto, setAbierto] = R.useState(false)
  const claves = ['cap', 'planFuegos', 'planBarreras']
  const elegir = (curso, idx, visible) => {
    if (curso.activo && activa?.bando === 'propio' && activa.idx === idx) onVer('cap', !visible)
    else onFase(curso.n, idx)
  }
  return h('section', { className: 'ver-bloque', 'aria-label': 'G-3 · fase 4 · Cursos de acción propios',
    style: { order: 5, '--gc': '#6da7ff' } },
    h(CabeceraGrupo, { react: R, nombre: '🔵 G-3 · fase 4 · Cursos de acción propios', abierto,
      onPlegar: () => setAbierto(!abierto), encendidos: claves.filter(k => verCapa[k] !== false).length, total: claves.length,
      onVisibilidad: mostrar => onGrupo(claves, mostrar) }),
    abierto && h('div', { className: 'ver-cuerpo', style: { display: 'grid', gap: 8 } },
      h('small', null, 'Selecciona el CAP y su fase. Los ojos permiten ocultar sus elementos sin borrarlos.'),
      ...cursosPropios(g3, fasesCOA).map(curso => {
        const visible = curso.activo && activa?.bando === 'propio' && verCapa.cap !== false
        return h('section', { key: curso.n, 'aria-label': curso.nombre, style: { display: 'grid', gap: 5, padding: 7, border: '1px solid #526590', borderRadius: 6 } },
          h('div', { style: { display: 'flex', gap: 5, alignItems: 'center' } },
            h('strong', { style: { flex: 1 } }, `${curso.nombre} · ${curso.fases.length} fases`),
            h(BotonOjo, { react: R, nombre: curso.nombre, visible, disabled: !curso.fases.length,
              onClick: () => elegir(curso, curso.activo && activa?.bando === 'propio' ? activa.idx : 0, visible) })),
          ...curso.fases.map((fase, idx) => h(Fase, { key: idx, react: R,
            texto: `Fase ${idx + 1}${fase?.nombre ? ` · ${fase.nombre}` : ''}`, activa: visible && activa.idx === idx,
            onClick: () => elegir(curso, idx, visible && activa.idx === idx) })),
          !curso.fases.length && h('small', null, 'Sin fases guardadas.'))
      }),
      ...[
        ['planFuegos', 'Plan de fuegos', planFuegos?.blancos?.length || 0],
        ['planBarreras', 'Plan de barreras', (ops?.obstaculos?.length || 0) + (ops?.posDef?.length || 0)]
      ].map(([id, nombre, cantidad]) => h('div', { key: id, style: { display: 'flex', gap: 5, alignItems: 'center' } },
        h('span', { style: { flex: 1 } }, `${nombre} (${cantidad})`),
        h(BotonOjo, { react: R, nombre, visible: verCapa[id] !== false, onClick: () => onVer(id, verCapa[id] === false) }))),
      h('button', { type: 'button', style: boton, onClick: onAbrir }, '🎬 Abrir C.A. por fases')))
}
