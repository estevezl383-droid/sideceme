import assert from 'node:assert/strict'
const M = await import(process.argv[2] || new URL('../organizacion/v1/mi-unidad.mjs', import.meta.url).href)
const { igual, configInicial, colocarMisUnidades, CATALOGO, paraGuardar, fichaMia, faltantes, buscarMia, nivelDeNombre, configurada } = M
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }
ok(igual('CE - II', 'CE-II'), 'CE - II'); ok(igual('DIMEC-1', 'DIV. MEC.-1'), 'DIMEC'); ok(igual('DIV MEC -1 – CE-I', 'DIV. MEC.-1'), 'con superior')
ok(!igual('DIV-1', 'DIV-10'), 'DIV-1≠DIV-10'); ok(!igual('DIV. MEC.-1', 'DIV-1'), 'MEC≠INF'); ok(!igual('CE-I', 'CE-II'), 'CE-I≠CE-II')
ok(CATALOGO.length === 18, 'catálogo 18 ' + CATALOGO.length); ok(CATALOGO.find(c => c.nombre === 'CE-II').dependientes.length === 14, 'CE-II 14')
ok(CATALOGO.find(c => c.nombre === 'DIV-5').dependientes.length === 15, 'DIV-5 15 ' + CATALOGO.find(c => c.nombre === 'DIV-5').dependientes.length)
ok(CATALOGO.find(c => c.nombre === 'DIV. MEC.-1').dependientes.length === 17, 'DIMEC-1 17 ' + CATALOGO.find(c => c.nombre === 'DIV. MEC.-1').dependientes.length)
for (const c of CATALOGO) { const ks = c.dependientes.map(d => d.designacion); ok(new Set(ks).size === ks.length, 'sin repetidos ' + c.nombre) }
ok(nivelDeNombre('CE-III') === 'cuerpo' && nivelDeNombre('DIV-7') === 'division' && nivelDeNombre('BRIG. MEC.-3') === 'brigada', 'niveles')
const c0 = configInicial({ ops: {}, orden: { unidad: 'CE - II' }, unidades: [], puesto: 'g3' })
ok(c0.nivel === 'cuerpo' && c0.superior === 'FF.TT.T.O.' && c0.dependientes.length === 14 && c0.puesto === 'g3' && c0.unidad === 'CE - II', 'inicial ' + JSON.stringify({ ...c0, dependientes: c0.dependientes.length }))
ok(faltantes({}).length === 3 && !faltantes(c0).length, 'faltantes')
const g = paraGuardar(c0); ok(g.unidad === 'CE - II' && g.dependientes.length === 14 && g.dependientes[0].id, 'paraGuardar')
ok(fichaMia(g, { lat: -17, lng: -66 }).textoSimbolo === 'CE' && fichaMia(g, { lat: -17, lng: -66 }).escalon === 'cuerpo', 'ficha CE')
ok(colocarMisUnidades([], g, {}).unidades === null, 'sin centro no pone')
const r1 = colocarMisUnidades([], g, { centro: { lat: -17.5, lng: -66.2 }, base: 1000 })
ok(r1.unidades.length === 15 && r1.madre.tipo === 'pc' && r1.nuevas.every(u => u.dependeDe === r1.madre.id) && r1.madre.disgregada.puestas.length === 14, 'pone 15')
ok(r1.nuevas.every(u => Math.abs(u.lat + 17.5) < 0.1 && Math.abs(u.lng + 66.2) < 0.1), 'alrededor')
const r2 = colocarMisUnidades(r1.unidades, g, {}); ok(r2.nada && r2.unidades === null, 'segunda vez nada')
const suelta = { id: 's1', bando: 'propias', tipo: 'unidad', escalon: 'division', arma: 'infanteria', designacion: 'DIV-2 – CE-II', lat: -18, lng: -65 }
const ajena = { id: 'x', bando: 'propias', tipo: 'pc', escalon: 'division', designacion: 'DIV-4' }
const deAjena = { id: 'y', bando: 'propias', tipo: 'unidad', escalon: 'regimiento', designacion: 'RI-15', dependeDe: 'x' }
const ce = { id: 'ce', bando: 'propias', tipo: 'unidad', escalon: 'cuerpo', designacion: 'CE - II', lat: -17, lng: -66 }
const r3 = colocarMisUnidades([ce, suelta, ajena, deAjena], g, { base: 5000 })
ok(r3.unidades.find(u => u.id === 's1').dependeDe === 'ce' && r3.nuevas.length === 13 && r3.vinculadas.length === 1 && r3.unidades.find(u => u.id === 'ce').tipo === 'pc', 'vincula la suelta')
ok(buscarMia(r3.unidades, 'CE-II').id === 'ce', 'busca la mía')
const g5 = paraGuardar(configInicial({ orden: { unidad: 'DIV-5' } }))
const r4 = colocarMisUnidades([ajena, deAjena], g5, { centro: { lat: -19, lng: -64 }, base: 9000 })
ok(r4.nuevas.some(u => u.designacion === 'RI-15') && r4.unidades.find(u => u.id === 'y').dependeDe === 'x', 'no roba el RI-15 de otra')
ok(configurada({ configUnidad: { confirmada: true, unidad: 'CE-I' } }) && !configurada({}), 'configurada')
const enemiga = { id: 'e', bando: 'enemigo', tipo: 'unidad', escalon: 'division', designacion: 'DIV-2' }
const r5 = colocarMisUnidades([ce, enemiga], g, {}); ok(r5.unidades.find(u => u.id === 'e').dependeDe === undefined && r5.nuevas.some(u => u.designacion === 'DIV-2'), 'no toca enemigas')
// 21-11-2026 · orden de batalla de la DEMIL + paleta de símbolos
const P = await import(new URL('../organizacion/v1/paleta-unidades.mjs', import.meta.url).href)
const cat = (n) => CATALOGO.find((c) => c.nombre === n)
ok(cat('FF.TT.T.O.').dependientes.map((d) => d.designacion).join() === 'CE-I,CE-II,CE-III,CE-IV' && nivelDeNombre('FF.TT.T.O.') === 'ejercito', 'FF.TT.T.O. con 4 CE')
ok(cat('CE-III').dependientes.map((d) => d.designacion).join() === 'DIV-8,DIV-9,DIV-6', 'CE-III = DIV-8, 9, 6 (DEMIL)')
ok(cat('DIV-8').superior === 'CE-III' && cat('DIV-7').superior === 'CZI - CREM' && cat('DIV-3').reducida, 'superiores DEMIL')
ok(JSON.stringify(M.arbolTemaBase().map((g) => g.cabeza)) === '["CE-I","CE-II","CE-III","CE-IV","CZSE","CZI - CREM"]', 'árbol')
ok(M.superioresDe('cuerpo')[0] === 'FF.TT.T.O.' && M.superioresDe('division').includes('CE-IV'), 'superiores por nivel')
ok(P.prefijoDe('RI-21') === 'RI-' && P.prefijoDe('DIV. MEC.-1') === 'DIV. MEC.-' && P.prefijoDe('CE-II') === 'CE-' && P.prefijoDe('RGTO. ART. 100') === 'RGTO. ART. ', 'prefijos')
ok(P.incompleta({ designacion: 'RI-', prefijo: 'RI-' }) && !P.incompleta({ designacion: 'RI-21', prefijo: 'RI-' }) && !P.incompleta({ designacion: 'RI-' }), 'incompleta')
const o = P.otraIgual({ designacion: 'RI-21', prefijo: 'RI-', escalon: 'regimiento', arma: 'infanteria' }); ok(o.designacion === 'RI-' && o.escalon === 'regimiento' && P.incompleta(o), 'Enter = otra igual')
const gp = paraGuardar({ nivel: 'cuerpo', unidad: 'CE-IV', superior: 'FF.TT.T.O.', dependientes: [{ id: 'a', ...P.filaDePaleta(P.deEscalon('division')[0]) }, { id: 'b', ...P.filaDePaleta(P.deEscalon('division')[1]), designacion: 'DIV. MEC.-4' }] })
ok(gp.dependientes.length === 1 && gp.dependientes[0].designacion === 'DIV. MEC.-4' && gp.dependientes[0].arma === 'mecanizada' && !('prefijo' in gp.dependientes[0]), 'la que quedó sin número no se guarda')
ok(P.ESCALONES_PALETA.every(([v]) => P.deEscalon(v).length > 0) && new Set(P.PALETA.map((x) => x.id)).size === P.PALETA.length, 'paleta completa, sin repetidos')
for (const it of P.PALETA) { const s = P.simboloSVG(it); ok(s.startsWith('<svg') && s.endsWith('</svg>') && !/NaN|undefined/.test(s), 'svg ' + it.id) }
ok(P.simboloSVG({ escalon: 'regimiento', arma: 'ninguna', textoSimbolo: '<b>' }).includes('&lt;b&gt;'), 'texto escapado')
ok(fichaMia({ nivel: 'ejercito', unidad: 'FF.TT.T.O.' }, { lat: -17, lng: -66 }).textoSimbolo === 'FF.TT.', 'ficha FF.TT.T.O.')
console.log('✅', n, 'comprobaciones')
