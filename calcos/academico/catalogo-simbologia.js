/*
 * Mesa del EM — Catálogo de SIMBOLOGÍA DOCTRINARIA (material didáctico).
 *
 * Qué es cada ficha:
 *   · la DENOMINACIÓN y la IMAGEN salen de los catálogos que la Mesa YA usa para
 *     dibujar (piezas, símbolos de unidad, obstáculos, tareas): se muestra el
 *     símbolo tal como la Mesa lo dibuja hoy, sin inventar ninguno nuevo;
 *   · la REFERENCIA es la cita que la propia Mesa (o SIDECEME) declara en su
 *     código para ese grupo de símbolos, con el apartado cuando la cita lo trae;
 *   · la VERIFICACIÓN dice si esa referencia se comprobó contra el documento.
 *
 * Ningún reglamento de simbología estuvo disponible al armar este catálogo
 * (ni en el repositorio ni en los documentos recibidos), así que NINGUNA ficha
 * está verificada y NINGUNA trae explicación doctrinaria redactada: sólo la
 * referencia declarada y lo que falta para verificarla. Cuando se tenga el
 * documento, se completa acá (explicacion, pagina, verificacion) ficha por ficha.
 *
 * No hay acá selección de objetivos, cálculo de tiro, secuencias de fuego ni
 * vinculación de símbolos con unidades: es una lámina para estudiar símbolos.
 */
;(function (global) {
  'use strict'

  // Estados de verificación de una ficha.
  const ESTADOS = {
    verificado: { nom: 'Verificada', ico: '✔', txt: 'Comprobada contra el documento, con página.' },
    'sin-verificar': { nom: 'Sin verificar', ico: '⚠', txt: 'La referencia es la que declara la Mesa; no se comprobó contra el documento.' },
    'no-verificable': { nom: 'No verificable', ico: '✖', txt: 'No hay referencia que se pueda comprobar: no se afirma nada sobre su significado.' },
  }

  // Referencias tal como las declara el código (texto exacto de la cita).
  const REF = {
    eaa1529fig6: {
      documento: 'EAA-15-29 «Simbología del PMTD y de Misiones Tácticas»',
      apartado: 'Figura 6 — Símbolos de Unidad Abreviados',
      pagina: null,
      origen: 'Cita que la Mesa muestra en «Organización de la tarea» y en la ficha de cada unidad (constante vU del compilado).',
    },
    eaa1507: {
      documento: 'EAA-15-07 / RC-02-15',
      apartado: null,
      pagina: null,
      origen:
        'Cita del comentario «v2.9.201 — SIMBOLOGÍA MILITAR REGLAMENTARIA» de SIDECEME (index.html), que porta el dibujo de símbolos de unidad de la Mesa: marco según el bando, magnitud arriba y arma al centro.',
    },
    rc02114: {
      documento: 'RC-02-114',
      apartado: null,
      pagina: null,
      origen: 'Cita del botón «🛡️ Defensa» de la Mesa: «Plan de barreras (RC-02-114)».',
    },
    rc02108: {
      documento: 'RC-02-108',
      apartado: null,
      pagina: null,
      origen: 'Cita del botón «🎯 Tareas» de la Mesa: «Tareas tácticas (RC-02-108)».',
    },
    ninguna: {
      documento: null,
      apartado: null,
      pagina: null,
      origen: 'La Mesa dibuja esta marca pero no cita reglamento para ella.',
    },
  }

  const FALTA = {
    eaa1529fig6: 'Tener a la vista la Figura 6 del EAA-15-29 para comparar cada símbolo y anotar la página.',
    eaa1507: 'Tener a la vista el EAA-15-07 / RC-02-15 y ubicar el apartado y la página de cada símbolo: la cita del código no los trae.',
    rc02114: 'Tener a la vista el RC-02-114 y ubicar el apartado y la página de cada obstáculo: la cita del código no los trae.',
    rc02108: 'Tener a la vista el RC-02-108 y ubicar el apartado y la página de cada tarea táctica: la cita del código no los trae.',
    ninguna: 'Que un reglamento defina esta marca. Mientras tanto se muestra sólo como la dibuja la Mesa.',
  }

  // Colores de dibujo en las láminas (sobre papel claro).
  const TINTA = '#10151f'
  const VERDE_ING = '#1f7a3d' // el mismo verde con que la Mesa dibuja las obras

  function ficha(lamina, id, denominacion, imagen, refId, extra = {}) {
    const r = REF[refId]
    return {
      id: `${lamina}:${id}`,
      lamina,
      denominacion,
      imagen,
      explicacion: null, // sin reglamento a la vista no se redacta (ver cabecera)
      usoEnLaMesa: extra.uso || null,
      notaDeLaMesa: extra.nota || null,
      referencia: { documento: r.documento, apartado: r.apartado, pagina: r.pagina, origen: r.origen },
      verificacion: {
        estado: extra.estado || (r.documento ? 'sin-verificar' : 'no-verificable'),
        falta: extra.falta || FALTA[refId],
      },
    }
  }

  const unidadDe = (bando, escalon, arma, mas = {}) => ({ tipo: 'unidad', unidad: { bando, escalon, arma, tipo: 'unidad', designacion: '', ...mas } })

  /*
   * Arma el catálogo con los catálogos de dibujo de la Mesa.
   *   s: { pLe, fl, T1, Nm, zg }  (los expone el compilado en window.__mesaSimbolos)
   * Devuelve { laminas: [{id, titulo, bajada, fichas:[...]}], fichas: [...] }.
   */
  function construirCatalogo(s = {}) {
    const fl = s.fl || []
    const T1 = (s.T1 || []).filter((a) => a.id !== 'ninguna')
    const pLe = s.pLe || []
    const Nm = s.Nm || {}
    const zg = s.zg || []
    const escalonNom = (id) => (fl.find((e) => e.id === id) || {}).nombre || id

    const laminas = [
      {
        id: 'marco',
        titulo: 'Marco del símbolo según el bando',
        bajada: 'Cómo la Mesa diferencia una unidad propia de una enemiga.',
        fichas: [
          ficha('marco', 'propias', 'Unidad propia (marco rectangular, azul)', unidadDe('propias', 'batallon', 'ninguna'), 'eaa1507', {
            uso: 'Toda ficha propia del calco se dibuja dentro de este marco.',
          }),
          ficha('marco', 'enemigo', 'Unidad enemiga (marco en rombo, rojo)', unidadDe('enemigo', 'batallon', 'ninguna'), 'eaa1507', {
            uso: 'Toda ficha enemiga del calco y de la plantilla se dibuja dentro de este marco.',
          }),
        ],
      },
      {
        id: 'magnitud',
        titulo: 'Magnitud del escalón',
        bajada: 'La marca que va arriba del marco: puntos, barras o aspas.',
        fichas: fl.map((e) =>
          ficha('magnitud', e.id, e.nombre, unidadDe('propias', e.id, 'ninguna'), 'eaa1507', {
            uso: `La Mesa la pone arriba del marco de toda ficha de magnitud «${e.nombre}».`,
          }),
        ),
      },
      {
        id: 'armas',
        titulo: 'Arma o servicio dentro del marco',
        bajada: 'El dibujo del centro del marco dice qué es la unidad (su TIPO).',
        fichas: T1.map((a) =>
          ficha('armas', a.id, a.nombre, unidadDe('propias', 'batallon', a.id), 'eaa1507', {
            uso: `Es el TIPO de unidad: lo que la ficha es, no a qué organización pertenece.`,
          }),
        ),
      },
      {
        id: 'agrupacion',
        titulo: 'Agrupación táctica y Fuerza de Tarea en la Mesa',
        bajada: 'Cómo marca la Mesa una organización de la tarea en el calco.',
        fichas: [
          ficha(
            'agrupacion',
            'marca',
            'Agrupación táctica (recuadro en la magnitud)',
            unidadDe('propias', 'batallon', 'infanteria', { agrupacion: true }),
            'ninguna',
            {
              uso: 'Al consolidar una agrupación de «🧩 Organización de la tarea», su ficha lleva este recuadro sobre la magnitud.',
            },
          ),
          ficha('agrupacion', 'ft', 'Fuerza de Tarea: designación «FT «nombre»»', { tipo: 'texto', texto: 'FT «NOMBRE»' }, 'ninguna', {
            uso: 'Una agrupación marcada como Fuerza de Tarea sale en el calco con la designación «FT «nombre»».',
          }),
        ],
      },
      {
        id: 'abreviados',
        titulo: 'Símbolos de unidad abreviados (piezas)',
        bajada: 'Los que usa la Mesa para las piezas de la Organización de la tarea.',
        fichas: pLe.map((p) =>
          ficha('abreviados', p.id, p.nom, { tipo: 'abrev', id: p.id }, 'eaa1529fig6', {
            uso: `Pieza «${p.corto}» al disgregar una unidad en «🧩 Organización de la tarea».`,
          }),
        ),
      },
      {
        id: 'obstaculos',
        titulo: 'Obstáculos del plan de barreras',
        bajada: 'Las marcas con que la Mesa dibuja cada obra de ingenieros.',
        fichas: Object.entries(Nm).map(([id, o]) =>
          ficha('obstaculos', id, `${o.nom} (${o.abrev})`, { tipo: 'obst', marca: o.marca, grosor: o.grosor }, 'rc02114', {
            uso: `Se traza como ${o.forma === 'linea' ? 'línea' : o.forma === 'area' ? 'área' : 'punto'} en «🛡️ Defensa».`,
            nota: o.ayuda || null,
          }),
        ),
      },
      {
        id: 'tareas',
        titulo: 'Tareas tácticas',
        bajada: 'Los símbolos del catálogo de tareas de la Mesa. Sólo el símbolo: no se asignan acá.',
        fichas: zg.map((t) =>
          ficha('tareas', t.id, t.nombre, { tipo: 'tarea', id: t.id }, 'rc02108', {
            uso: 'Símbolo de la tarea en el calco.',
          }),
        ),
      },
      {
        id: 'pendientes',
        titulo: 'Consultas pendientes',
        bajada: 'Símbolos por los que se preguntó: lo que se sabe y de dónde sale, sin verificar en el reglamento.',
        fichas: [
          {
            id: 'pendientes:cruz-negra',
            lamina: 'pendientes',
            denominacion: 'Cruz negra (+) — plan de blancos',
            imagen: { tipo: 'cruz' },
            explicacion: null,
            segunDocente:
              'Es una cruz recta negra, simple, sin marco: marca dónde está un blanco del plan de blancos. (Indicación del docente, 28-09-2026, con la imagen de la cruz.)',
            usoEnLaMesa: 'La Mesa no dibuja hoy esta marca: el plan de blancos no está en el catálogo de símbolos de la app.',
            notaDeLaMesa: null,
            referencia: {
              documento: null,
              apartado: null,
              pagina: null,
              origen: 'Indicación del docente (no es cita de reglamento). En el código de la Mesa no hay una cita de reglamento para esta marca.',
            },
            verificacion: {
              estado: 'no-verificable',
              falta:
                'La página del reglamento de simbología (EAA-15-29 y/o EAA-15-07 / RC-02-15) donde figura la cruz del plan de blancos, para pasarla de «indicación del docente» a referencia verificada.',
            },
          },
        ],
      },
    ]
    const fichas = laminas.flatMap((l) => l.fichas)
    return { laminas, fichas, ESTADOS }
  }

  // Revisión que exige la entrega: cada ficha con una referencia comprobable o
  // declarada como no verificable, y ninguna «verificada» sin página ni documento.
  function revisarReferencias(fichas) {
    const problemas = []
    for (const f of fichas) {
      const r = f.referencia || {}
      const v = f.verificacion || {}
      if (!ESTADOS[v.estado]) problemas.push(`${f.id}: estado de verificación desconocido «${v.estado}»`)
      if (v.estado === 'verificado' && !(r.documento && r.pagina)) problemas.push(`${f.id}: figura verificada sin documento y página`)
      if (v.estado === 'sin-verificar' && !r.documento) problemas.push(`${f.id}: sin verificar pero sin documento citado`)
      if (v.estado !== 'verificado' && !String(v.falta || '').trim()) problemas.push(`${f.id}: no dice qué falta para verificarla`)
      if (!String(r.origen || '').trim()) problemas.push(`${f.id}: no dice de dónde sale la referencia`)
      if (v.estado !== 'verificado' && f.explicacion) problemas.push(`${f.id}: trae explicación doctrinaria sin estar verificada`)
      if (!String(f.denominacion || '').trim()) problemas.push(`${f.id}: sin denominación`)
      if (!f.imagen) problemas.push(`${f.id}: sin imagen`)
    }
    const ids = fichas.map((f) => f.id)
    for (const id of new Set(ids)) if (ids.filter((x) => x === id).length > 1) problemas.push(`${id}: ficha repetida`)
    return problemas
  }

  const api = { construirCatalogo, revisarReferencias, ESTADOS, REF, TINTA, VERDE_ING }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else global.MesaAcademicaCatalogo = api
})(typeof window !== 'undefined' ? window : globalThis)
