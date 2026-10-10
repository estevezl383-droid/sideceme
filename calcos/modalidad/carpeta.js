/* 📕 LA CARPETA DEL PROFESOR (modalidad Profesor de la Mesa del EM). Código aparte del compilado,
   puro (se prueba en Node). Lo pidió Sergio (10-10-2026) con la captura del paso 4 (CMOC): la IA
   le devolvió el análisis del terreno y «no hay dónde pegar el resultado… debe ir registrado en
   algún lado, ya que servirá para los cursos de acción o el anexo de inteligencia… y si hay algo
   para el profesor, que se vaya sumando para que el profesor vaya solucionando».
   · Cada paso del tablero del profesor guarda la RESPUESTA DE LA IA que se pegó (una por paso;
     guardar otra vez la reemplaza).
   · La sección «PARA EL PROFESOR» de cada respuesta se separa y se va SUMANDO, paso por paso.
   · Lo que es SOLUCIÓN del profesor (no va a los alumnos) se distingue de lo que va a los
     alumnos: se adivina por el texto y por el paso, y el profesor lo cambia.
   · paraPedido(): lo guardado entra en los pedidos de los pasos que siguen (la OGO y su Anexo A
     de Inteligencia, los cursos de acción del enemigo, la pauta de corrección…).
   · markdown() / leerMarkdown(): la carpeta entera en un .md para leerla, imprimirla o llevarla a
     otro equipo (el .md lleva adentro, en un comentario invisible, los datos para volver a
     cargarla).
   Dónde se guarda lo decide modalidad.js (el IndexedDB «sid-profesor» de ese navegador), NO en el
   ejercicio: el ejercicio se reparte a los alumnos y la solución del profesor no tiene que viajar
   con él. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica()
  else raiz.SIDCarpetaProfesor = fabrica()
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict'

  var MARCA = 'sid-carpeta-profesor:v1'
  var DESTINOS = {
    solucion: { id: 'solucion', nom: '🔒 Solución del profesor (no va a los alumnos)', corto: '🔒 SOLUCIÓN DEL PROFESOR' },
    alumnos: { id: 'alumnos', nom: '📤 Va a los alumnos', corto: '📤 VA A LOS ALUMNOS' }
  }

  function limpia(s) { return String(s == null ? '' : s).replace(/\r\n?/g, '\n') }
  function recorta(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '\n[… recortado: ' + (s.length - n) + ' caracteres más en la carpeta del profesor]' : s }
  function fecha(iso) {
    var d = new Date(iso)
    if (!iso || isNaN(d)) return ''
    var p = function (x) { return (x < 10 ? '0' : '') + x }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  }

  // ─── «PARA EL PROFESOR» ─────────────────────────────────────────────────────────────
  // Un título «## PARA EL PROFESOR» (o «**PARA EL PROFESOR**», o «PARA EL PROFESOR:» en su propia
  // línea) hasta el próximo título del mismo nivel o más alto (o hasta el final).
  // Una oración que empieza «Para el profesor es importante…» NO es el título: tiene que ser
  // título «#», ir en negrita, en MAYÚSCULAS o sola en su línea («Para el profesor:»).
  var RE_TIT = /^[ \t]*(#{1,6}[ \t]+)?(\*\*|__)?[ \t]*(?:\d+[.)-]?[ \t]*)?(?:📌|🎓|🧑‍🏫|👨‍🏫|🔒)?[ \t]*(PARA[ \t]+EL[ \t]+PROFESOR)\b(.*)$/i
  function esTitulo(linea) {
    var m = RE_TIT.exec(linea)
    if (!m) return false
    return !!(m[1] || m[2] || m[3] === m[3].toUpperCase() || /^\s*(\*\*|__)?\s*[:.—-]?\s*$/.test(m[4]))
  }
  function nivel(linea) { var m = /^[ \t]*(#{1,6})[ \t]/.exec(linea); return m ? m[1].length : 0 }
  function separar(texto) {
    var lineas = limpia(texto).split('\n'), producto = [], profesor = [], i = 0
    while (i < lineas.length) {
      if (!esTitulo(lineas[i])) { producto.push(lineas[i]); i++; continue }
      var n = nivel(lineas[i]), j = i + 1
      // sin «#» la sección va hasta el próximo título de cualquier nivel
      while (j < lineas.length && !(nivel(lineas[j]) && (!n || nivel(lineas[j]) <= n)) && !esTitulo(lineas[j])) j++
      var cuerpo = lineas.slice(i + 1, j).join('\n').replace(/^\s+|\s+$/g, '')
      // el título puede traer el texto en la misma línea («PARA EL PROFESOR: …»)
      var resto = lineas[i].replace(/^[\s#*_\d.)-]*/, '').replace(/^(?:📌|🎓|🧑‍🏫|👨‍🏫|🔒)?\s*PARA\s+EL\s+PROFESOR\b[\s*_:.—-]*/i, '').replace(/(\*\*|__)\s*$/, '').trim()
      profesor.push((resto ? resto + '\n' : '') + cuerpo)
      i = j
    }
    // lo que queda: sin las rayas «---» sueltas al final
    var p = producto.join('\n').replace(/(\n\s*(-{3,}|\*{3,}|_{3,})\s*)+$/, '').replace(/^\s+|\s+$/g, '')
    return { producto: p, profesor: profesor.filter(function (x) { return x.trim() }).join('\n\n') }
  }

  // ¿La respuesta dice que es solución del profesor? (el pedido le pide a la IA que lo aclare)
  var RE_SOLUCION = /SOLUCI[ÓO]N\s+(DEL|PARA\s+EL)\s+PROFESOR|PARRILLA\s+DE\s+CORRECCI[ÓO]N|NO\s+(DEBE\s+)?(ENTREGARSE|SE\s+ENTREGA|DARSE|SE\s+DA|VA)\s+A\s+LOS\s+ALUMNOS|NO\s+(SE\s+LES?\s+)?(ENTREGA|DA)\s+A\s+LOS\s+ALUMNOS/i
  // paso.carpeta: 'solucion' (siempre), 'alumnos' (siempre) o nada (se adivina por el texto)
  function destinoDe(paso, texto) {
    if (paso && (paso.carpeta === 'solucion' || paso.carpeta === 'alumnos')) return paso.carpeta
    // la línea «DESTINO: …» que el pedido le pide a la IA (en las primeras líneas)
    var d = /DESTINO\W{0,4}\s*:?\s*(?:\*\*|__)?\s*(SOLUCI[ÓO]N|VA\s+A\s+LOS\s+ALUMNOS|(?:SE\s+)?ENTREGA)/i.exec(String(texto || '').slice(0, 600))
    if (d) return /^SOLUCI/i.test(d[1]) ? 'solucion' : 'alumnos'
    return RE_SOLUCION.test(texto || '') ? 'solucion' : 'alumnos'
  }

  // ─── La carpeta ─────────────────────────────────────────────────────────────────────
  // { ejercicio, pasos: { '4': { n, tit, texto, destino, guardado } }, actualizado }
  function vacia(ejercicio) { return { ejercicio: String(ejercicio || ''), pasos: {}, actualizado: '' } }
  function lista(c) {
    return Object.keys((c && c.pasos) || {}).map(function (k) { return c.pasos[k] }).filter(function (p) { return p && String(p.texto || '').trim() })
      .sort(function (a, b) { return a.n - b.n })
  }
  function cuantos(c) { return lista(c).length }
  // Guarda (o reemplaza) la respuesta de un paso. Devuelve una carpeta nueva.
  function poner(c, paso, texto, op) {
    op = op || {}
    texto = limpia(texto).replace(/^\s+|\s+$/g, '')
    var nueva = { ejercicio: (c && c.ejercicio) || op.ejercicio || '', pasos: Object.assign({}, (c && c.pasos) || {}), actualizado: op.ahora || new Date().toISOString() }
    if (!texto) { delete nueva.pasos[paso.n]; return nueva }
    nueva.pasos[paso.n] = {
      n: paso.n,
      tit: paso.nom,
      texto: texto,
      destino: DESTINOS[op.destino] ? op.destino : destinoDe(paso, texto),
      guardado: nueva.actualizado
    }
    return nueva
  }
  function quitar(c, n) { var x = poner(c, { n: n }, ''); return x }
  function cambiarDestino(c, n, destino) {
    if (!c || !c.pasos || !c.pasos[n] || !DESTINOS[destino]) return c
    var nueva = { ejercicio: c.ejercicio, pasos: Object.assign({}, c.pasos), actualizado: c.actualizado }
    nueva.pasos[n] = Object.assign({}, c.pasos[n], { destino: destino })
    return nueva
  }

  // Lo «PARA EL PROFESOR» de todos los pasos, sumado en orden.
  function notasProfesor(c) {
    return lista(c).map(function (p) { var s = separar(p.texto).profesor; return s ? { n: p.n, tit: p.tit, guardado: p.guardado, texto: s } : null }).filter(Boolean)
  }

  // Reparte `total` caracteres entre textos: a cada uno lo que necesita, sin pasarse de su parte
  // (lo que sobra de los cortos queda para los largos).
  function reparto(largos, total) {
    var orden = largos.map(function (l, i) { return { l: l, i: i } }).sort(function (a, b) { return a.l - b.l })
    var res = [], resta = total
    orden.forEach(function (o, k) { var parte = Math.floor(resta / (orden.length - k)); res[o.i] = Math.min(o.l, parte); resta -= res[o.i] })
    return res
  }

  // Para los pedidos a la IA de los pasos que siguen. `excepto`: el paso que se está pidiendo.
  function paraPedido(c, op) {
    op = op || {}
    var ps = lista(c).filter(function (p) { return p.n !== op.excepto })
    if (!ps.length) return ''
    var cab = function (p) { return '#### Paso ' + p.n + ' · ' + p.tit + ' (' + DESTINOS[p.destino === 'solucion' ? 'solucion' : 'alumnos'].corto + (p.guardado ? ' · guardado ' + fecha(p.guardado) : '') + ')\n' }
    var partes = reparto(ps.map(function (p) { return p.texto.length }), op.limite || 45000)
    return ps.map(function (p, i) { return cab(p) + recorta(p.texto, Math.max(1500, partes[i])) }).join('\n\n')
  }

  // ─── El .md de la carpeta ───────────────────────────────────────────────────────────
  function markdown(c, meta) {
    meta = meta || {}
    var ps = lista(c), sol = ps.filter(function (p) { return p.destino === 'solucion' }), alu = ps.filter(function (p) { return p.destino !== 'solucion' })
    var notas = notasProfesor(c)
    var t = '# 📕 Carpeta del profesor — ' + (c.ejercicio || '(sin ejercicio)') + '\n\n'
    if (meta.escalon || meta.foco) t += (meta.escalon ? '**Escalón:** ' + meta.escalon + (meta.alumnos ? ' · alumnos: ' + meta.alumnos : '') + '  \n' : '') + (meta.foco ? '**El ejercicio entrena:** ' + meta.foco + '  \n' : '')
    t += '**Actualizada:** ' + (fecha(c.actualizado) || '—') + ' · ' + ps.length + ' paso(s) con respuesta de la IA\n\n'
    t += '> Lo que el profesor fue resolviendo con la IA en «🧑‍🏫 Armar el ejercicio» de la Mesa del EM. La parte 1 y la parte 2 son SÓLO PARA EL PROFESOR: no se entregan a los alumnos.\n\n'
    t += '## 1. Para el profesor (se va sumando paso a paso)\n\n' + (notas.length ? notas.map(function (x) { return '### Paso ' + x.n + ' · ' + x.tit + (x.guardado ? ' — ' + fecha(x.guardado) : '') + '\n\n' + x.texto }).join('\n\n') : '_(Todavía ninguna respuesta trajo la sección «PARA EL PROFESOR».)_') + '\n\n'
    t += '## 2. 🔒 Solución del profesor (NO entregar a los alumnos)\n\n' + (sol.length ? sol.map(function (p) { return '### Paso ' + p.n + ' · ' + p.tit + (p.guardado ? ' — ' + fecha(p.guardado) : '') + '\n\n' + separar(p.texto).producto }).join('\n\n') : '_(Nada marcado como solución todavía.)_') + '\n\n'
    t += '## 3. 📤 Lo que va a los alumnos\n\n' + (alu.length ? alu.map(function (p) { return '### Paso ' + p.n + ' · ' + p.tit + (p.guardado ? ' — ' + fecha(p.guardado) : '') + '\n\n' + separar(p.texto).producto }).join('\n\n') : '_(Nada para los alumnos todavía.)_') + '\n'
    // los datos para volver a cargarla (invisible al leer el .md): «--» escapado para que el
    // comentario no se cierre antes de tiempo
    var datos = JSON.stringify({ ejercicio: c.ejercicio, pasos: c.pasos, actualizado: c.actualizado }).replace(/--/g, '-\\u002d').replace(/>/g, '\\u003e')
    return t + '\n<!-- ' + MARCA + ' ' + datos + ' -->\n'
  }
  // Vuelve a armar la carpeta desde su .md (el comentario del final). Sin él, no se puede.
  function leerMarkdown(texto) {
    var m = new RegExp('<!--\\s*' + MARCA.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*([\\s\\S]*?)\\s*-->').exec(String(texto || ''))
    if (!m) throw new Error('Ese archivo no es una carpeta del profesor bajada de la Mesa (le falta la marca del final).')
    var d = JSON.parse(m[1])
    if (!d || typeof d.pasos !== 'object') throw new Error('La carpeta está dañada: no trae los pasos.')
    var c = vacia(d.ejercicio)
    Object.keys(d.pasos).forEach(function (k) {
      var p = d.pasos[k]
      if (p && isFinite(+p.n) && String(p.texto || '').trim()) c.pasos[+p.n] = { n: +p.n, tit: String(p.tit || 'Paso ' + p.n), texto: limpia(p.texto), destino: DESTINOS[p.destino] ? p.destino : 'alumnos', guardado: p.guardado || '' }
    })
    c.actualizado = d.actualizado || ''
    return c
  }
  // Suma una carpeta cargada a la que ya hay: de cada paso queda la respuesta más nueva.
  function juntar(a, b) {
    var c = { ejercicio: (a && a.ejercicio) || (b && b.ejercicio) || '', pasos: Object.assign({}, (a && a.pasos) || {}), actualizado: (a && a.actualizado) || '' }
    lista(b).forEach(function (p) { var ya = c.pasos[p.n]; if (!ya || String(p.guardado) > String(ya.guardado)) c.pasos[p.n] = p })
    if (b && String(b.actualizado) > String(c.actualizado)) c.actualizado = b.actualizado
    return c
  }

  return { DESTINOS: DESTINOS, separar: separar, destinoDe: destinoDe, vacia: vacia, lista: lista, cuantos: cuantos, poner: poner, quitar: quitar, cambiarDestino: cambiarDestino, notasProfesor: notasProfesor, paraPedido: paraPedido, markdown: markdown, leerMarkdown: leerMarkdown, juntar: juntar, fecha: fecha }
})
