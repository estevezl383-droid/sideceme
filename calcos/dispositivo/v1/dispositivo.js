/* 🧭 EL DISPOSITIVO DE LA CARTA PARA LA IA (20-10-2026). Código aparte del compilado, puro (se prueba en
   Node). Lo pidió Sergio con las «Tareas de las unidades de maniobra» que escribió la IA para el CE-I:
   «DIV MEC-2 (Esfuerzo Principal): defiende el sector norte… DIV-6 (Reserva Operacional)…», cuando en el
   calco la DIV-6 está adelante al norte, la DIV-1 adelante al sur y la DIV MEC-2 atrás: «dos adelante, uno
   atrás, en dirección del enemigo».
   Qué pasaba: a la IA le llegaban las fichas con su lat, lng sueltas; nada le decía cuál está adelante, en
   qué sector, ni cuál atrás, y repartía los sectores por el orden de la Orden.
   Qué hace: dispositivo(ej) mira de dónde viene el enemigo (la dirección elegida en la hoja P.D., las fichas
   enemigas o el frente del Área de Operaciones), toma las unidades de maniobra que dependen de la unidad
   considerada (las de «⊞ Disgregar», o las propias del escalón más alto debajo de ella) y dice de cada una
   si está ADELANTE (y en qué sector: norte / centro / sur, o este / oeste) o ATRÁS (2º escalón / reserva).
   texto(ej) lo escribe para el pedido, con la regla: los sectores, el esfuerzo principal y la reserva
   salen de ESTE dispositivo, no del orden en que la Orden nombra las unidades. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDDispositivo = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  var KM_LAT = 110.574
  var RANGO = ['equipo', 'escuadra', 'seccion', 'compania', 'batallon', 'regimiento', 'brigada', 'division', 'cuerpo', 'ejercito']
  var MANIOBRA = ['infanteria', 'mecanizada', 'motorizada', 'andina', 'selva', 'caballeria', 'cabmec', 'blindada', 'aerotransportada']
  // De dónde VIENE el enemigo (este, norte): las mismas de la hoja P.D. (calcos/plantilla-ajuste).
  var DIRS = { NO: [-1, 1], N: [0, 1], NE: [1, 1], O: [-1, 0], E: [1, 0], SO: [-1, -1], S: [0, -1], SE: [1, -1] }
  var NOMBRES = { NO: 'NOROESTE', N: 'NORTE', NE: 'NORESTE', O: 'OESTE', E: 'ESTE', SO: 'SUDOESTE', S: 'SUR', SE: 'SUDESTE' }

  function num(x) { return x != null && x !== '' && isFinite(+x) }
  function enemiga(u) { return /enem|rojo/i.test(String((u && u.bando) || '')) }
  function nombre(u) { return String((u && (u.designacion || u.nombre)) || '').replace(/\s+/g, ' ').trim() || 'Unidad' }
  function plano(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '') }
  function unitario(v) { var n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n] }
  function centro(ps) {
    if (!ps.length) return null
    var s = ps.reduce(function (a, p) { return [a[0] + p[0], a[1] + p[1]] }, [0, 0])
    return [s[0] / ps.length, s[1] / ps.length]
  }
  // El rumbo (este, norte) más cercano entre los 8 de la rosa.
  function rumbo(v) {
    var mejor = null, max = -2
    Object.keys(DIRS).forEach(function (k) { var d = unitario(DIRS[k]), p = d[0] * v[0] + d[1] * v[1]; if (p > max) { max = p; mejor = k } })
    return mejor
  }

  // Las unidades a ordenar: las dependientes de una madre disgregada (la unidad considerada si es una), o las
  // propias de maniobra del escalón más alto por debajo de la unidad considerada.
  function dependientes(ej) {
    var us = ((ej && ej.unidades) || []).filter(function (u) { return u && !enemiga(u) && num(u.lat) && num(u.lng) })
    var uc = plano((ej && ej.ops && ej.ops.unidadConsiderada && ej.ops.unidadConsiderada.nombre) || (ej && ej.ordenSup && ej.ordenSup.unidad) || '')
    var madres = us.filter(function (u) { return u.disgregada })
    var madre = madres.filter(function (m) { return uc && plano(m.designacion) === uc })[0] || madres[0] || null
    var lista
    if (madre) lista = us.filter(function (u) { return u.dependeDe === madre.id && (u.tipo || 'unidad') === 'unidad' })
    else {
      var yo = us.filter(function (u) { return uc && plano(u.designacion) === uc })[0]
      var tope = yo ? RANGO.indexOf(yo.escalon) : 99
      var cand = us.filter(function (u) { return (u.tipo || 'unidad') === 'unidad' && u !== yo && RANGO.indexOf(u.escalon) < tope && MANIOBRA.indexOf(u.arma) >= 0 })
      var alto = cand.reduce(function (a, u) { return Math.max(a, RANGO.indexOf(u.escalon)) }, -1)
      lista = cand.filter(function (u) { return RANGO.indexOf(u.escalon) === alto })
      madre = yo || null
    }
    return { madre: madre, maniobra: lista.filter(function (u) { return MANIOBRA.indexOf(u.arma) >= 0 }), apoyo: lista.filter(function (u) { return MANIOBRA.indexOf(u.arma) < 0 }) }
  }

  // Hacia dónde está el enemigo, en (este, norte) desde el centro de las propias, y de dónde se sacó.
  function haciaEnemigo(ej, c0, kx) {
    var pd = (ej && ej.picb && (ej.picb.pd || ej.picb)) || {}
    var id = pd.dirEnemigo || (ej && ej.dirEnemigo)
    if (DIRS[id]) return { v: unitario(DIRS[id]), de: 'lo elegido en «🧭 ¿De dónde viene el enemigo?» (hoja P.D.)' }
    var a = function (p) { return [(p[0] - c0[0]) * kx, (p[1] - c0[1]) * KM_LAT] }
    var rojos = ((ej && ej.unidades) || []).filter(function (u) { return u && enemiga(u) && num(u.lat) && num(u.lng) }).map(function (u) { return a([+u.lng, +u.lat]) })
    var cr = centro(rojos)
    if (cr && Math.hypot(cr[0], cr[1]) > 1) return { v: unitario(cr), de: 'las fichas enemigas de la carta' }
    var ao = (ej && ej.ops && ej.ops.areaOps) || {}
    var fr = (ao.frente || []).filter(function (p) { return Array.isArray(p) && num(p[0]) && num(p[1]) }).map(function (p) { return a([+p[0], +p[1]]) })
    var cf = centro(fr)
    if (cf && Math.hypot(cf[0], cf[1]) > 1) return { v: unitario(cf), de: 'el frente del Área de Operaciones' }
    return null
  }

  function dispositivo(ej) {
    var d = dependientes(ej)
    var us = d.maniobra
    if (us.length < 2) return null
    var ps = us.map(function (u) { return [+u.lng, +u.lat] })
    var c0 = centro(ps), kx = 111.32 * Math.cos((c0[1] * Math.PI) / 180)
    var en = haciaEnemigo(ej, c0, kx)
    if (!en) return null
    var f = en.v, l = [-f[1], f[0]] // l: 90° a la izquierda del frente
    var xy = ps.map(function (p) { return [(p[0] - c0[0]) * kx, (p[1] - c0[1]) * KM_LAT] })
    var adel = xy.map(function (p) { return p[0] * f[0] + p[1] * f[1] })
    var lado = xy.map(function (p) { return p[0] * l[0] + p[1] * l[1] })
    var tope = Math.max.apply(null, adel)
    var ancho = Math.max.apply(null, lado) - Math.min.apply(null, lado)
    var umbral = Math.max(4, 0.4 * ancho)
    // Si TODAS quedarían atrás de una sola, no hay escalonamiento claro: van todas adelante.
    var atras = adel.map(function (a) { return tope - a > umbral })
    if (atras.filter(function (x) { return !x }).length < 1) atras = atras.map(function () { return false })
    // El sector se nombra por la rosa: el lado izquierdo/derecho del frente, en norte/sur o este/oeste.
    var porNorte = Math.abs(l[1]) >= Math.abs(l[0])
    var izq = porNorte ? (l[1] > 0 ? 'NORTE' : 'SUR') : (l[0] > 0 ? 'ESTE' : 'OESTE')
    var der = { NORTE: 'SUR', SUR: 'NORTE', ESTE: 'OESTE', OESTE: 'ESTE' }[izq]
    var delante = us.map(function (u, i) { return i }).filter(function (i) { return !atras[i] }).sort(function (a, b) { return lado[b] - lado[a] })
    var sector = {}
    delante.forEach(function (i, k) {
      var n = delante.length
      sector[i] = n === 1 ? 'CENTRO' : k === 0 ? izq : k === n - 1 ? der : n === 3 ? 'CENTRO' : 'CENTRO-' + (k < n / 2 ? izq : der)
    })
    // Se listan de norte a sur (o de oeste a este).
    if (izq === 'SUR' || izq === 'ESTE') delante.reverse()
    var fila = function (i) {
      var u = us[i]
      return { unidad: nombre(u), id: u.id, escalon: u.escalon, arma: u.arma, posicion: atras[i] ? 'atras' : 'adelante', sector: atras[i] ? '' : sector[i], kmAtras: Math.round(tope - adel[i]) }
    }
    var detras = us.map(function (u, i) { return i }).filter(function (i) { return atras[i] }).sort(function (a, b) { return adel[b] - adel[a] })
    var filas = delante.concat(detras).map(fila)
    var r = rumbo(en.v)
    return { enemigoDel: NOMBRES[r], de: en.de, madre: d.madre ? nombre(d.madre) : '', filas: filas, apoyo: d.apoyo.map(nombre) }
  }

  function texto(ej) {
    var d = dispositivo(ej)
    if (!d) return ''
    var adelante = d.filas.filter(function (x) { return x.posicion === 'adelante' })
    var atras = d.filas.filter(function (x) { return x.posicion === 'atras' })
    var t = '### EL DISPOSITIVO EN LA CARTA (manda sobre el orden en que la Orden nombra las unidades)\n' +
      'El enemigo viene del ' + d.enemigoDel + ' (según ' + d.de + '). Las unidades de maniobra' + (d.madre ? ' del ' + d.madre : '') + ', por donde el profesor las puso en el calco:\n' +
      d.filas.map(function (x) {
        return '- ' + x.unidad + ': ' + (x.posicion === 'adelante' ? 'ADELANTE (primer escalón), sector ' + x.sector : 'ATRÁS, a unos ' + x.kmAtras + ' km detrás de las de adelante (segundo escalón / RESERVA)')
      }).join('\n') + '\n' +
      (d.apoyo.length ? '- Apoyo de combate (no reciben sector de maniobra): ' + d.apoyo.join(', ') + '\n' : '') +
      'REGLA: los sectores, el esfuerzo principal y la reserva salen de ESTE dispositivo. ' +
      (adelante.length ? 'Las de ADELANTE defienden / atacan en SU sector (' + adelante.map(function (x) { return x.unidad + ': ' + x.sector }).join('; ') + '); el esfuerzo principal es una de ellas. ' : '') +
      (atras.length ? 'La' + (atras.length > 1 ? 's' : '') + ' de ATRÁS (' + atras.map(function (x) { return x.unidad }).join(', ') + ') ' + (atras.length > 1 ? 'son' : 'es') + ' el segundo escalón / la RESERVA (contraataque, bloqueo en profundidad): nunca el esfuerzo principal de primer escalón ni un sector de adelante. ' : '') +
      'Si la Orden o un documento del ejercicio dicen otra cosa, seguí el calco y avisalo en «PARA EL PROFESOR».\n\n'
    return t
  }

  return { dispositivo: dispositivo, texto: texto, dependientes: dependientes }
})
