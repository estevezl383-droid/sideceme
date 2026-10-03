// Los GRÁFICOS del G-4 (tablero de la instalación y propuesta del ASDI). HTML y SVG
// simples, sin bibliotecas: cada función recibe `h` (createElement de React o el h() del
// editor, la misma firma) y devuelve elementos. Cada barra, segmento e ícono lleva su
// `title` (la Mesa lo muestra al pasar el mouse o al tocar).
//
// Colores: las clases y los medios vienen de planeamiento.js (paleta validada para el
// fondo oscuro de la Mesa); los estados (cumple / no cumple) llevan siempre ícono y texto.
const TINTA = '#e6eef6'
const TINTA2 = '#a9b9cc'
const TINTA3 = '#7f8ea6'
const PISTA = 'rgba(255,255,255,0.06)'
export const ESTADO = { bien: '#0ca30c', alerta: '#fab219', mal: '#d03b3b' }
const fmt0 = (x) => (Number.isFinite(x) ? Math.round(x).toLocaleString('es') : '—')

const caja = { background: '#101a27', border: '1px solid #2e4057', borderRadius: 8, padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }
const titulo = { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: '#ffc278', textTransform: 'uppercase' }
const sub = { fontSize: 10.5, color: TINTA3, lineHeight: 1.35 }

const botonImagen = { background: 'transparent', border: '1px solid #3a516b', color: '#a9b9cc', borderRadius: 5, padding: '1px 6px', fontSize: 11, cursor: 'pointer', lineHeight: 1.4 }
export function tarjeta(h, { tit, nota = '', ancho = 1, dato = '', imagen = true, children = [] }) {
  return h(
    'section',
    { style: { ...caja, gridColumn: ancho > 1 ? `span ${ancho}` : undefined }, 'data-grafico': dato || undefined },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } }, h('div', { style: { ...titulo, flex: 1 } }, tit), imagen ? h('button', { type: 'button', style: botonImagen, title: 'Bajar este gráfico como imagen (PNG)', 'data-no-imagen': '1', onClick: (e) => exportarImagen(e.currentTarget.closest('section'), tit) }, '🖼️') : null),
    nota ? h('div', { style: sub }, nota) : null,
    ...[].concat(children),
  )
}

// ─── Bajar un gráfico (o el tablero entero) como imagen PNG ─────────────────────────
// Se copia el pedazo de pantalla con sus estilos dentro de un SVG y se pinta en un
// canvas. Si el navegador no deja sacar el PNG (Safari con algunos contenidos), se baja
// el SVG: se abre en el navegador y Word lo inserta como imagen.
const PROPS = ['display', 'position', 'top', 'left', 'right', 'bottom', 'width', 'height', 'min-width', 'max-width', 'min-height', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'background-color', 'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'text-overflow', 'white-space', 'overflow-x', 'overflow-y', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis', 'gap', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-column', 'align-items', 'align-self', 'justify-content', 'box-sizing', 'opacity', 'transform', 'vertical-align', 'list-style-type', 'border-collapse', 'text-shadow', 'visibility', 'overflow-wrap', 'text-decoration-line']
export const nombreArchivo = (t) => String(t || 'grafico').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'grafico'
function bajar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
export function svgDe(nodo, fondo = '#101a27') {
  const r = nodo.getBoundingClientRect()
  const W = Math.ceil(Math.max(r.width, nodo.scrollWidth, 50))
  const orig = [nodo, ...nodo.querySelectorAll('*')]
  const clon = nodo.cloneNode(true)
  const copia = [clon, ...clon.querySelectorAll('*')]
  orig.forEach((el, i) => {
    const c = copia[i]
    if (!c || (el instanceof SVGElement && el.ownerSVGElement)) return
    const cs = getComputedStyle(el)
    c.setAttribute('style', PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'))
    if (el.tagName === 'INPUT') c.setAttribute('value', el.value)
    if (el.tagName === 'TEXTAREA') c.textContent = el.value
    if (el.tagName === 'SELECT') for (const [k, o] of [...el.options].entries()) if (c.options?.[k]) o.selected ? c.options[k].setAttribute('selected', 'selected') : c.options[k].removeAttribute('selected')
  })
  for (const x of clon.querySelectorAll('[data-no-imagen]')) x.remove()
  clon.style.overflow = 'visible'
  clon.style.height = 'auto'
  clon.style.maxHeight = 'none'
  clon.style.width = `${W}px`
  clon.style.background = fondo
  // Se mide la altura real ya sin las barras de desplazamiento.
  const medir = document.createElement('div')
  Object.assign(medir.style, { position: 'fixed', left: '-100000px', top: '0', width: `${W}px` })
  medir.appendChild(clon)
  document.body.appendChild(medir)
  const H = Math.ceil(clon.getBoundingClientRect().height || r.height)
  medir.remove()
  const xml = new XMLSerializer().serializeToString(clon)
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xml}</foreignObject></svg>`, W, H }
}
export async function exportarImagen(nodo, titulo = 'grafico', fondo = '#101a27') {
  if (!nodo || typeof document === 'undefined') return 'No hay nada para bajar.'
  const nombre = `G4_${nombreArchivo(titulo)}`
  let svg = ''
  try {
    const x = svgDe(nodo, fondo)
    svg = x.svg
    const img = new Image()
    await new Promise((ok, mal) => {
      img.onload = ok
      img.onerror = mal
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    })
    const k = 2
    const cv = document.createElement('canvas')
    cv.width = x.W * k
    cv.height = x.H * k
    const ctx = cv.getContext('2d')
    ctx.fillStyle = fondo
    ctx.fillRect(0, 0, cv.width, cv.height)
    ctx.scale(k, k)
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise((ok, mal) => {
      try {
        cv.toBlob((b) => (b ? ok(b) : mal(new Error('sin PNG'))), 'image/png')
      } catch (e) {
        mal(e)
      }
    })
    bajar(blob, `${nombre}.png`)
    return `🖼️ Imagen bajada: ${nombre}.png`
  } catch {
    if (!svg) return 'No se pudo armar la imagen.'
    bajar(new Blob([svg], { type: 'image/svg+xml' }), `${nombre}.svg`)
    return `🖼️ Se bajó como ${nombre}.svg (este navegador no deja hacer el PNG): ábrelo en el navegador o insertalo en Word.`
  }
}

// ─── Números grandes ────────────────────────────────────────────────────────────────
export function kpis(h, items = []) {
  return h(
    'div',
    { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 8 }, 'data-grafico': 'kpis' },
    ...items.map((k, i) =>
      h(
        'div',
        { key: i, title: k.titulo || '', style: { background: '#101a27', border: `1px solid ${k.estado ? ESTADO[k.estado] : '#2e4057'}`, borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
        h('div', { style: { fontSize: 9.5, color: TINTA2, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 } }, k.icono ? `${k.icono} ` : '', k.rot),
        h('div', { style: { fontSize: 24, fontWeight: 750, color: TINTA, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, k.valor),
        k.sub ? h('div', { style: { fontSize: 10.5, color: k.estado ? ESTADO[k.estado] : TINTA3, lineHeight: 1.3 } }, k.estado === 'mal' ? '✗ ' : k.estado === 'bien' ? '✓ ' : k.estado === 'alerta' ? '⚠ ' : '', k.sub) : null,
      ),
    ),
  )
}

// ─── Leyenda ────────────────────────────────────────────────────────────────────────
export function leyenda(h, series = []) {
  return h(
    'div',
    { style: { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 10.5, color: TINTA2 } },
    ...series.map((s) => h('span', { key: s.id, style: { display: 'inline-flex', alignItems: 'center', gap: 5 } }, h('span', { style: { width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block' } }), s.corto || s.nom)),
  )
}

// ─── Barras horizontales (apiladas o simples) ───────────────────────────────────────
// filas: [{ id, nom, sub, partes: [{ id, valor, color, titulo }], txt }]
export function barras(h, { filas = [], series = null, max = null, fmt = fmt0, alto = 14, dato = '', col = 'minmax(90px, 34%)' }) {
  const tope = max || Math.max(1e-9, ...filas.map((f) => (f.partes || []).reduce((s, p) => s + (p.valor || 0), 0)))
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 6 }, 'data-grafico': dato || undefined },
    series && series.length > 1 ? leyenda(h, series) : null,
    ...filas.map((f, i) => {
      const total = (f.partes || []).reduce((s, p) => s + (p.valor || 0), 0)
      return h(
        'div',
        { key: f.id || i, style: { display: 'grid', gridTemplateColumns: `${col} 1fr auto`, alignItems: 'center', gap: 8 } },
        h('div', { style: { minWidth: 0 } }, h('div', { style: { fontSize: 11.5, color: TINTA, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, title: f.nom }, f.nom), f.sub ? h('div', { style: { fontSize: 10, color: TINTA3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, f.sub) : null),
        h(
          'div',
          { style: { height: alto, background: PISTA, borderRadius: 4, display: 'flex', gap: 2, overflow: 'hidden' } },
          ...(f.partes || [])
            .filter((p) => p.valor > 0)
            .map((p, k, arr) =>
              h('div', {
                key: p.id || k,
                title: p.titulo || `${p.nom || ''} ${fmt(p.valor)}`.trim(),
                style: { width: `${(100 * p.valor) / tope}%`, minWidth: 2, background: p.color, borderRadius: k === arr.length - 1 ? '0 4px 4px 0' : 0 },
              }),
            ),
        ),
        h('div', { style: { fontSize: 11.5, color: TINTA, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textAlign: 'right', minWidth: col === 'minmax(90px, 34%)' ? 54 : 26 } }, f.txt ?? fmt(total)),
      )
    }),
  )
}

// ─── Íconos (camión, cisterna, ambulancia, grúa) ────────────────────────────────────
function icono(h, tipo, color, tam = 22, key) {
  const c = color
  const ruedas = [h('circle', { key: 'r1', cx: 7, cy: 17, r: 2.3, fill: '#0b111a', stroke: c, strokeWidth: 1.4 }), h('circle', { key: 'r2', cx: 18, cy: 17, r: 2.3, fill: '#0b111a', stroke: c, strokeWidth: 1.4 })]
  const cabina = h('path', { key: 'cab', d: 'M17 8h3.5l2.5 4v4h-6z', fill: c })
  let cuerpo
  if (tipo === 'cisterna') cuerpo = h('rect', { key: 'c', x: 1, y: 8, width: 15, height: 7.5, rx: 3.7, fill: c })
  else if (tipo === 'ambulancia') cuerpo = [h('rect', { key: 'c', x: 1, y: 5, width: 15, height: 10.5, rx: 1.2, fill: c }), h('path', { key: 'x', d: 'M7.3 7.5h2.4v2.2h2.2v2.4H9.7v2.2H7.3v-2.2H5.1V9.7h2.2z', fill: '#0b111a' })]
  else if (tipo === 'grua') cuerpo = [h('rect', { key: 'c', x: 1, y: 10, width: 15, height: 5.5, rx: 1, fill: c }), h('path', { key: 'b', d: 'M3 10L9 3l1.4 1L5 10z', fill: c })]
  else cuerpo = h('rect', { key: 'c', x: 1, y: 6, width: 15, height: 9.5, rx: 1.2, fill: c })
  return h('svg', { key, width: tam, height: tam * 0.83, viewBox: '0 0 24 20', 'aria-hidden': 'true', style: { flex: '0 0 auto' } }, ...[].concat(cuerpo), cabina, ...ruedas)
}

// filas: [{ id, nom, n, color, icono, sub, disponibles }]
export function pictogramas(h, { filas = [], tope = 40, dato = '' }) {
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 10 }, 'data-grafico': dato || undefined },
    ...filas.map((f, i) => {
      const n = Math.max(0, Math.round(f.n || 0))
      const disp = Number.isFinite(f.disponibles) && f.disponibles >= 0 ? Math.round(f.disponibles) : null
      const vistos = Math.min(n, tope)
      const faltan = disp != null ? Math.max(0, n - disp) : 0
      return h(
        'div',
        { key: f.id || i, style: { display: 'flex', flexDirection: 'column', gap: 4 } },
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' } }, h('b', { style: { fontSize: 22, color: TINTA, fontVariantNumeric: 'tabular-nums' } }, String(n)), h('span', { style: { fontSize: 12, color: TINTA } }, f.nom), f.sub ? h('span', { style: { fontSize: 10.5, color: TINTA3 } }, f.sub) : null),
        h(
          'div',
          { style: { display: 'flex', flexWrap: 'wrap', gap: 3 }, title: `${n} × ${f.nom}` },
          ...Array.from({ length: vistos }, (_, k) => icono(h, f.icono, disp != null && k >= disp ? ESTADO.mal : f.color, 22, k)),
          n > tope ? h('span', { style: { fontSize: 11, color: TINTA2, alignSelf: 'center' } }, `+${n - tope}`) : null,
        ),
        disp != null ? h('div', { style: { fontSize: 10.5, color: faltan ? ESTADO.mal : ESTADO.bien } }, faltan ? `✗ Faltan ${faltan} (hay ${disp})` : `✓ Alcanzan (hay ${disp}, sobran ${disp - n})`) : null,
      )
    }),
  )
}

// ─── Ciclo de un vehículo en la jornada (Gantt 0 → TD horas) ─────────────────────────
// filas: [{ id, nom, ciclo: { tc, ida, horas, viajes, td } }]
export const COLOR_CICLO = { carga: '#c98500', ida: '#3987e5', regreso: '#256abf', libre: 'transparent' }
export function ciclo(h, { filas = [], td = 10, dato = '' }) {
  const pasoH = td > 12 ? 4 : td > 6 ? 2 : 1
  const marcas = Array.from({ length: Math.floor(td / pasoH) + 1 }, (_, i) => i * pasoH)
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 6 }, 'data-grafico': dato || undefined },
    leyenda(h, [{ id: 'carga', corto: 'Carga / descarga (TC)', color: COLOR_CICLO.carga }, { id: 'ida', corto: 'Ida', color: COLOR_CICLO.ida }, { id: 'regreso', corto: 'Regreso', color: COLOR_CICLO.regreso }]),
    ...filas.map((f, i) => {
      const c = f.ciclo
      const seg = []
      let t = 0
      const pct = (x) => `${(100 * x) / td}%`
      for (let v = 0; v < Math.max(1, c.viajes); v++) {
        const partes = [
          ['carga', c.tc / 2, 'Carga'],
          ['ida', c.ida, 'Ida'],
          ['carga', c.tc / 2, 'Descarga'],
          ['regreso', c.ida, 'Regreso'],
        ]
        for (const [tipo, dur, nom] of partes) {
          if (t >= td) break
          const d = Math.min(dur, td - t)
          seg.push(h('div', { key: `${v}-${nom}`, title: `Viaje ${v + 1} · ${nom}: ${d.toFixed(1)} h (de ${t.toFixed(1)} a ${(t + d).toFixed(1)} h)`, style: { position: 'absolute', left: pct(t), width: `calc(${pct(d)} - 2px)`, top: 2, bottom: 2, background: COLOR_CICLO[tipo], borderRadius: 3, opacity: c.viajes >= 1 ? 1 : 0.35 } }))
          t += dur
        }
        if (c.viajes < 1) break
      }
      return h(
        'div',
        { key: f.id || i, style: { display: 'grid', gridTemplateColumns: 'minmax(90px, 34%) 1fr auto', alignItems: 'center', gap: 8 } },
        h('div', { style: { fontSize: 11.5, color: TINTA, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, title: f.nom }, f.nom),
        h('div', { style: { position: 'relative', height: 18, background: PISTA, borderRadius: 4 } }, ...seg),
        h('div', { style: { fontSize: 11, color: c.viajes >= 1 ? TINTA : ESTADO.mal, whiteSpace: 'nowrap', minWidth: 64, textAlign: 'right' } }, c.viajes >= 1 ? `${c.viajes} viaje${c.viajes === 1 ? '' : 's'}` : '✗ no llega'),
      )
    }),
    h(
      'div',
      { style: { display: 'grid', gridTemplateColumns: 'minmax(90px, 34%) 1fr auto', gap: 8 } },
      h('span'),
      h('div', { style: { position: 'relative', height: 14, fontSize: 9.5, color: TINTA3 } }, ...marcas.map((m) => h('span', { key: m, style: { position: 'absolute', left: `${(100 * m) / td}%`, transform: m === 0 ? 'none' : m === td ? 'translateX(-100%)' : 'translateX(-50%)', whiteSpace: 'nowrap' } }, `${m} h`))),
      h('span', { style: { minWidth: 64 } }),
    ),
  )
}

// ─── Dona ───────────────────────────────────────────────────────────────────────────
export function dona(h, { partes = [], centro = '', sub: subCentro = '', tam = 132, fmt = fmt0, dato = '' }) {
  const total = partes.reduce((s, p) => s + (p.valor > 0 ? p.valor : 0), 0)
  const r = 44
  const C = 2 * Math.PI * r
  let ac = 0
  const arcos = total
    ? partes
        .filter((p) => p.valor > 0)
        .map((p, i) => {
          const largo = (C * p.valor) / total
          const gap = partes.length > 1 ? Math.min(2, largo / 3) : 0
          const el = h('circle', { key: p.id || i, cx: 60, cy: 60, r, fill: 'none', stroke: p.color, strokeWidth: 16, strokeDasharray: `${Math.max(0, largo - gap)} ${C}`, strokeDashoffset: -ac, transform: 'rotate(-90 60 60)' }, h('title', null, `${p.nom}: ${fmt(p.valor)} (${Math.round((100 * p.valor) / total)} %)`))
          ac += largo
          return el
        })
    : []
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }, 'data-grafico': dato || undefined },
    h('svg', { width: tam, height: tam, viewBox: '0 0 120 120', role: 'img', 'aria-label': partes.map((p) => `${p.nom} ${fmt(p.valor)}`).join(', ') }, h('circle', { cx: 60, cy: 60, r, fill: 'none', stroke: PISTA, strokeWidth: 16 }), ...arcos, h('text', { x: 60, y: 60, textAnchor: 'middle', fill: TINTA, fontSize: 17, fontWeight: 700 }, centro), h('text', { x: 60, y: 76, textAnchor: 'middle', fill: TINTA3, fontSize: 9.5 }, subCentro)),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: TINTA2, minWidth: 140 } },
      ...partes
        .filter((p) => p.valor > 0)
        .map((p, i) => h('div', { key: p.id || i, style: { display: 'flex', alignItems: 'center', gap: 6 } }, h('span', { style: { width: 10, height: 10, borderRadius: 2, background: p.color, flex: '0 0 auto' } }), h('span', { style: { flex: 1 } }, p.nom), h('b', { style: { color: TINTA, fontVariantNumeric: 'tabular-nums' } }, fmt(p.valor)), h('span', { style: { color: TINTA3, width: 34, textAlign: 'right' } }, `${Math.round((100 * p.valor) / (total || 1))} %`))),
    ),
  )
}

// ─── Medidor: necesarios contra disponibles ─────────────────────────────────────────
export function medidor(h, { necesarios = 0, disponibles = null, nom = '' }) {
  if (!Number.isFinite(disponibles)) return null
  const tope = Math.max(necesarios, disponibles, 1)
  const ok = disponibles >= necesarios
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 3 }, title: `${nom}: necesarios ${necesarios}, disponibles ${disponibles}` },
    h('div', { style: { position: 'relative', height: 12, background: PISTA, borderRadius: 4 } }, h('div', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(100 * disponibles) / tope}%`, background: ok ? ESTADO.bien : ESTADO.mal, borderRadius: 4 } }), h('div', { style: { position: 'absolute', left: `calc(${(100 * necesarios) / tope}% - 1px)`, top: -3, bottom: -3, width: 2, background: TINTA } })),
    h('div', { style: { fontSize: 10.5, color: ok ? ESTADO.bien : ESTADO.mal } }, ok ? `✓ ${nom}: hay ${disponibles} para ${necesarios} necesarios` : `✗ ${nom}: faltan ${necesarios - disponibles} (hay ${disponibles} de ${necesarios})`),
  )
}

// ─── Embudo (los lugares que se descartaron por cada motivo) ────────────────────────
export function embudo(h, { pasos = [], dato = '' }) {
  const tope = Math.max(1, ...pasos.map((p) => p.n))
  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 4 }, 'data-grafico': dato || undefined },
    ...pasos.map((p, i) =>
      h(
        'div',
        { key: i, style: { display: 'grid', gridTemplateColumns: 'minmax(120px, 46%) 1fr auto', alignItems: 'center', gap: 8 } },
        h('span', { style: { fontSize: 11, color: p.fuerte ? TINTA : TINTA2, fontWeight: p.fuerte ? 700 : 400 } }, p.nom),
        h('div', { style: { height: 12, background: PISTA, borderRadius: 4 } }, h('div', { title: `${p.nom}: ${p.n}`, style: { width: `${(100 * p.n) / tope}%`, minWidth: p.n ? 2 : 0, height: '100%', background: p.color, borderRadius: 4 } })),
        h('b', { style: { fontSize: 11.5, color: TINTA, minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }, fmt0(p.n)),
      ),
    ),
  )
}

// ─── Croquis (la carta en chico): polígonos, líneas, flechas y puntos ───────────────
// Coordenadas [lng, lat]. Se proyecta en un plano local, norte arriba.
// `foco`: si se da, el encuadre sale sólo de esas coordenadas (lo demás se recorta).
export function croquis(h, { poligonos = [], lineas = [], flechas = [], puntos = [], celdas = [], foco = null, alto = 280, ancho = 600, dato = '', rotulo = '' }) {
  const valido = (p) => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1])
  const enfocar = Array.isArray(foco) ? foco.filter(valido) : []
  const todos = enfocar.length ? enfocar : [...poligonos.flatMap((p) => p.coords || []), ...lineas.flatMap((l) => l.coords || []), ...flechas.flatMap((f) => [f.de, f.a]), ...puntos.map((p) => p.p), ...celdas.map((c) => c.p)].filter(valido)
  if (!todos.length) return h('div', { style: sub }, 'Sin nada para dibujar.')
  const lat0 = todos.reduce((s, p) => s + +p[1], 0) / todos.length
  const k = Math.cos((lat0 * Math.PI) / 180)
  const X = (p) => +p[0] * k
  const Y = (p) => -+p[1]
  const xs = todos.map(X)
  const ys = todos.map(Y)
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const pad = Math.max(x1 - x0, y1 - y0, 0.01) * (enfocar.length ? 0.18 : 0.08)
  x0 -= pad
  x1 += pad
  y0 -= pad
  y1 += pad
  // El encuadre llena el rectángulo del croquis (se agranda el lado corto, centrado).
  if ((x1 - x0) / (y1 - y0) < ancho / alto) {
    const extra = ((y1 - y0) * ancho) / alto - (x1 - x0)
    x0 -= extra / 2
    x1 += extra / 2
  } else {
    const extra = ((x1 - x0) * alto) / ancho - (y1 - y0)
    y0 -= extra / 2
    y1 += extra / 2
  }
  const w = x1 - x0
  const hh = y1 - y0
  const esc = Math.min(ancho / w, alto / hh)
  const W = w * esc
  const H = hh * esc
  const px = (p) => [(X(p) - x0) * esc, (Y(p) - y0) * esc]
  const camino = (cs, cerrar) => cs.map((p, i) => `${i ? 'L' : 'M'}${px(p).map((v) => v.toFixed(1)).join(' ')}`).join(' ') + (cerrar ? ' Z' : '')
  const halo = { paintOrder: 'stroke', stroke: '#0b111a', strokeWidth: 3, strokeLinejoin: 'round' }
  const kmPx = esc / 111.32
  // Rótulos sin encimarse: si choca con uno ya puesto, se corre hacia abajo.
  const puestos = []
  puestos.push([W - 30, 0, W, 42])
  const anchoTxt = (texto, tam) => String(texto).length * tam * 0.6
  const lugar = (x, y, texto, tam = 10.5, ancla = 'start') => {
    const w = anchoTxt(texto, tam)
    const x0r = ancla === 'middle' ? x - w / 2 : ancla === 'end' ? x - w : x
    let yy = y
    for (let k = 0; k < 8; k++) {
      const r = [x0r, yy - tam, x0r + w, yy + 2]
      if (!puestos.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) {
        puestos.push(r)
        return yy
      }
      yy += tam + 2
    }
    puestos.push([x0r, yy - tam, x0r + w, yy + 2])
    return yy
  }
  const escala = [1, 2, 5, 10, 20, 50].find((km) => km * kmPx > W / 8) || 50
  const el = []
  for (const [i, c] of celdas.entries()) {
    const [x, y] = px(c.p)
    const t = Math.max(2, (c.lado || 1) * kmPx)
    el.push(h('rect', { key: `c${i}`, x: x - t / 2, y: y - t / 2, width: t, height: t, fill: c.color, opacity: c.opacidad ?? 0.55 }))
  }
  for (const [i, p] of poligonos.entries()) {
    if ((p.coords || []).length < 3) continue
    el.push(h('path', { key: `p${i}`, d: camino(p.coords, true), fill: p.relleno || 'none', fillOpacity: p.opacidad ?? 0.25, stroke: p.color || TINTA2, strokeWidth: p.grosor || 1.5, strokeDasharray: p.trazo || undefined }, p.titulo ? h('title', null, p.titulo) : null))
    if (p.rot) {
      const c = p.coords.reduce((s, q) => [s[0] + +q[0] / p.coords.length, s[1] + +q[1] / p.coords.length], [0, 0])
      const [x, y] = px(c)
      el.push(h('text', { key: `pt${i}`, x, y: y + 4, textAnchor: 'middle', fill: p.colorRot || p.color || TINTA, fontSize: p.tamRot || 12, fontWeight: 800, style: halo }, p.rot))
    }
  }
  for (const [i, l] of lineas.entries()) {
    if ((l.coords || []).length < 2) continue
    el.push(h('path', { key: `l${i}`, d: camino(l.coords, false), fill: 'none', stroke: l.color || TINTA2, strokeWidth: l.grosor || 2, strokeDasharray: l.trazo || undefined, strokeOpacity: l.opacidad ?? 1, strokeLinecap: 'round' }, l.titulo ? h('title', null, l.titulo) : null))
    if (l.rot) {
      // El rótulo va en el primer tramo de la línea que se ve en el croquis.
      let pos = null
      for (let k = 1; k < l.coords.length && !pos; k++) {
        const [ax, ay] = px(l.coords[k - 1])
        const [bx, by] = px(l.coords[k])
        for (let t = 0; t <= 1 && !pos; t += 0.05) {
          const x = ax + (bx - ax) * t
          const y = ay + (by - ay) * t
          if (x > 6 && x < W - anchoTxt(l.rot, 10.5) - 8 && y > 16 && y < H - 6) pos = [x, y]
        }
      }
      if (pos) el.push(h('text', { key: `lt${i}`, x: pos[0] + 4, y: lugar(pos[0] + 4, pos[1] - 5, l.rot), fill: l.colorRot || l.color, fontSize: 10.5, fontWeight: 700, style: halo }, l.rot))
    }
  }
  // Los rótulos de las unidades tienen prioridad sobre los de las flechas.
  // Cerca del borde derecho el rótulo va a la izquierda del símbolo.
  const posRot = puntos.map((p) => {
    if (!p.rot) return null
    const [x, y] = px(p.p)
    const t = p.tam || 7
    const tam = p.tamRot || 10.5
    const izq = x + t * 1.5 + anchoTxt(p.rot, tam) > W - 4
    const xr = izq ? x - t * 1.5 : x + t * 1.5
    return { x: xr, ancla: izq ? 'end' : 'start', y: lugar(xr, y + 4, p.rot, tam, izq ? 'end' : 'start') }
  })
  for (const [i, f] of flechas.entries()) {
    const [ax, ay] = px(f.de)
    const [bx, by] = px(f.a)
    const ang = Math.atan2(by - ay, bx - ax)
    const g = Math.max(1.5, f.grosor || 2)
    const punta = 6 + g
    const ex = bx - Math.cos(ang) * (f.recorte || 10)
    const ey = by - Math.sin(ang) * (f.recorte || 10)
    el.push(h('line', { key: `f${i}`, x1: ax, y1: ay, x2: ex - Math.cos(ang) * punta * 0.6, y2: ey - Math.sin(ang) * punta * 0.6, stroke: f.color || '#ffc278', strokeWidth: g, strokeLinecap: 'round', strokeOpacity: 0.9 }, f.titulo ? h('title', null, f.titulo) : null))
    el.push(h('path', { key: `fp${i}`, d: `M${ex} ${ey} L${ex - Math.cos(ang - 0.45) * punta} ${ey - Math.sin(ang - 0.45) * punta} L${ex - Math.cos(ang + 0.45) * punta} ${ey - Math.sin(ang + 0.45) * punta} Z`, fill: f.color || '#ffc278' }))
    if (f.rot) {
      const mx = ax + (ex - ax) * 0.62
      const my = ay + (ey - ay) * 0.62
      el.push(h('text', { key: `ft${i}`, x: mx, y: lugar(mx, my - 4, f.rot, 10.5, 'middle'), textAnchor: 'middle', fill: '#ffe3a0', fontSize: 10.5, fontWeight: 700, style: halo }, f.rot))
    }
  }
  for (const [i, p] of puntos.entries()) {
    const [x, y] = px(p.p)
    const t = p.tam || 7
    const forma =
      p.forma === 'rombo'
        ? h('path', { d: `M${x} ${y - t} L${x + t} ${y} L${x} ${y + t} L${x - t} ${y} Z`, fill: p.color, stroke: '#0b111a', strokeWidth: 1.5 })
        : p.forma === 'cuadrado'
          ? h('rect', { x: x - t, y: y - t, width: 2 * t, height: 2 * t, rx: 2, fill: p.color, stroke: '#0b111a', strokeWidth: 1.5 })
          : h('rect', { x: x - t * 1.3, y: y - t * 0.85, width: 2.6 * t, height: 1.7 * t, rx: 1.5, fill: p.relleno || '#0b111a', stroke: p.color, strokeWidth: 2 })
    el.push(h('g', { key: `u${i}` }, forma, p.titulo ? h('title', null, p.titulo) : null))
    if (p.rot) el.push(h('text', { key: `ut${i}`, x: posRot[i].x, y: posRot[i].y, textAnchor: posRot[i].ancla, fill: p.colorRot || TINTA, fontSize: p.tamRot || 10.5, fontWeight: 700, style: halo }, p.rot))
  }
  // Norte y escala.
  el.push(h('g', { key: 'norte' }, h('path', { d: `M${W - 16} 10 L${W - 11} 24 L${W - 16} 20 L${W - 21} 24 Z`, fill: TINTA }), h('text', { x: W - 16, y: 36, textAnchor: 'middle', fill: TINTA, fontSize: 10, fontWeight: 700, style: halo }, 'N')))
  el.push(h('g', { key: 'escala' }, h('line', { x1: 10, y1: H - 10, x2: 10 + escala * kmPx, y2: H - 10, stroke: TINTA, strokeWidth: 2 }), h('text', { x: 10, y: H - 15, fill: TINTA, fontSize: 10, style: halo }, `${escala} km`)))
  return h('svg', { viewBox: `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`, width: '100%', style: { display: 'block', maxHeight: alto + 40, background: '#0d1621', borderRadius: 6 }, role: 'img', 'aria-label': rotulo || 'Croquis', 'data-grafico': dato || undefined }, ...el)
}
