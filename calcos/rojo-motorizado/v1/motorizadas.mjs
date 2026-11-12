// ============================================================
// motorizadas.mjs — LA BRIGADA MOTORIZADA y LA DIVISIÓN MOTORIZADA de RAGNAR
// para el Manual Rojo de la hoja P.D. (plantilla doctrinal del enemigo).
//
// Sergio, 11-nov-2026: «necesito que diseñes brigadas y divisiones motorizadas en
// la aplicación, tengo puras brigadas acorazadas; elaborame las plantillas
// doctrinales para brigadas motorizadas para que pueda tener esas opciones».
//
// Hasta acá el selector «1 · A qué enemigo, y a qué nivel» del Manual Rojo traía
// Regimiento (REG. MOT. REF.), Brigada (1ra. BRIG. ACORAZADA) y División
// (DIVISIÓN ACORAZADA). Este módulo agrega dos opciones más, con el mismo
// contrato que `ORBAT_POR_NIVEL` de manualRojo.js: el compilado las suma en
// `DM`, `cD`, `x2` e `IIe` (ver CAMBIOS-EN-EL-COMPILADO.md, 11-11-2026 (2)).
//
// ⚠️ LA REGLA DE LA CASA: 📄 = está en un documento y se cita · 📕 = lo dice el
// RDO-20001 · ✎ = lo arma la app y se dice. El Apéndice 1 «Organización de
// RAGNAR» SÓLO trae la División Acorazada: NO trae una Brigada Motorizada ni
// una División Motorizada. Por eso las dos se ARMAN con piezas que sí están
// documentadas, y la plantilla lo avisa en pantalla:
//   · 📄 Apéndice 1: el Regimiento Motorizado Reforzado — batallones de
//     infantería sobre MOWAG Piraña 8×8 (3 Cías. × 108 h y 14 veh.), Cía. de
//     Morteros 81, Cía. A/B de misiles TOW sobre HMMWV, G.A.C. (105 OTO Melara /
//     155 SOLTAM), Cía. de Ingenieros (barreminas, contramovilidad, minador),
//     Batallón Logístico (Cía. de Transportes MB 1017) y Pelotón de Aviación.
//   · 📄 Apéndice 2: «MOWAG PIRAÑA … 404 … incluyendo 50 portamorteros de 120 mm
//     y 40 antiaéreos de 20 mm. Pertenecen a la División Motorizada» — o sea,
//     RAGNAR TIENE una División Motorizada; lo que no tiene es organigrama.
//   · 📕 RDO-20001 Art. 127-128: la infantería motorizada se moviliza en
//     vehículos a rueda y hace a pie la aproximación, el asalto y la ruptura;
//     «puede formar parte de una brigada motorizada, con especial capacidad
//     para atacar una posición defensiva organizada y ocupar terrenos críticos».
//   · 📕 Tabla 3 (Art. 252): División → Batallón de ingenieros; Brigada →
//     Compañía de ingenieros independiente.
//   · 📕 Art. 1628: exploración motorizada = pelotones de motos y vehículos
//     ligeros · 📄 Apéndice 2: 200 Honda XR 250 y 200 Honda Rancher
//     «Reconocimientos».
//
// Sin LEOPARD, sin M109, sin BIBER: todo eso es de la Brigada Acorazada. Si en
// el ejercicio aparecen tanques, el enemigo NO es motorizado.
// ============================================================

const AP1 = '📄 Apéndice 1 «Organización de RAGNAR» al Anexo «B»'
const AP2 = '📄 Apéndice 2 «Armamento de RAGNAR» al Anexo «B»'
const ARMADA = '✎ El Apéndice 1 NO trae esta organización'

const unid = (id, sigla, escalon, arma, o = {}) => ({ id, sigla, escalon, arma, tipo: 'unidad', ...o })
const esc2 = (r, k) => [+(r[0] * k).toFixed(1), +(r[1] * k).toFixed(1)]

// ------------------------------------------------------------
// LAS UNIDADES NUEVAS (se suman a UNIDADES_ROJO). Los batallones sobre Piraña,
// el REG. TELECOM., el REG. LOG. DIV. y el PLTN. AV. NO se repiten acá: son los
// del Apéndice 1 que ya están cargados (`bat_pirana`, `rtel`, `rlog`, `ptav`).
// ------------------------------------------------------------
export const UNIDADES_MOT = {
  // ── Dentro de la BRIGADA MOTORIZADA ────────────────────────────────
  mot_gac: unid('mot_gac', 'G.A.C. (105/155)', 'batallon', 'artilleria', {
    papel: 'Apoyo de fuego de la Brigada',
    composicion: 'Grupo de Artillería de Campaña de 3 baterías remolcadas (105 mm OTO Melara / 155 mm '
      + 'SOLTAM M-71) arrastradas por camiones MB 1017.',
    piezaId: 'soltam71',
    fuente: `${AP1}, Regimiento Motorizado Reforzado — «Grupo de Artillería de Campaña» (modelo) · ${AP2}: `
      + '362 SOLTAM M-71, 54 OTO Melara.',
  }),
  mot_mort120: unid('mot_mort120', 'CÍA. MORT. 120 (PIRAÑA)', 'compania', 'morteros', {
    papel: 'Fuego orgánico de la Brigada',
    composicion: 'Compañía de morteros de 120 mm sobre MOWAG Piraña portamortero.',
    piezaId: 'mort120',
    fuente: `${AP2}: «MOWAG PIRAÑA … incluyendo 50 portamorteros de 120 mm … Pertenecen a la División `
      + 'Motorizada».',
    nota: '✎ El reparto de los 50 portamorteros entre las brigadas lo hace la app.',
  }),
  mot_ab: unid('mot_ab', 'CÍA. A/B (TOW / SPIKE)', 'compania', 'antitanque', {
    papel: 'Antiblindaje de la Brigada',
    composicion: 'Compañía Antiblindaje de misiles TOW y SPIKE LR/ER sobre HMMWV.',
    fuente: `${AP1}: «Cía. Antiblindaje de misiles TOW sobre HMMWV» · ${AP2}: SPIKE «LR y ER en los `
      + 'Humvees».',
  }),
  mot_ing: unid('mot_ing', 'CÍA. ING. IND.', 'compania', 'ingenieria', {
    papel: 'Movilidad y contramovilidad de la Brigada',
    composicion: 'Compañía de Ingenieros independiente: barreminas, contramovilidad y minador sobre Piraña.',
    fuente: '📕 RDO-20001, Tabla 3 (Art. 252): «Brigada — Compañía de ingenieros independiente» · '
      + `${AP1}: barreminas, contramovilidad y minador sobre Piraña.`,
  }),
  mot_aa: unid('mot_aa', 'BAT. AA. (MISTRAL / PIRAÑA 20)', 'compania', 'antiaerea', {
    papel: 'Defensa antiaérea de la Brigada',
    composicion: 'Batería antiaérea con MOWAG Piraña de 20 mm y misiles MISTRAL sobre camión.',
    fuente: `${AP2}: Piraña «40 antiaéreos de 20 mm … de la División Motorizada» y 750 MISTRAL «emplazados `
      + 'en camiones».',
  }),
  mot_expl: unid('mot_expl', 'PEL. EXPL. MOT.', 'seccion', 'caballeria', {
    papel: 'Exploración de la Brigada',
    composicion: 'Pelotón de exploración de motos y vehículos ligeros (Honda XR 250, HMMWV).',
    fuente: '📕 RDO-20001, Art. 1628: «pelotones de exploración de motos y de vehículos ligeros» · '
      + `${AP2}: 200 Honda XR 250 Tornado «Reconocimientos».`,
  }),
  mot_tel: unid('mot_tel', 'CÍA. TELECOM.', 'compania', 'comunicaciones', {
    papel: 'Enlace del PC de la Brigada',
    composicion: 'Compañía de Telecomunicaciones de la Brigada (VAMTAC y M577 de puesto de mando).',
    fuente: `✎ Igual a la de la 1ra. Brigada Acorazada (${AP1}, «Cía. de Telecomunicaciones»).`,
  }),
  mot_log: unid('mot_log', 'CÍA. LOG.', 'compania', 'logistica', {
    papel: 'Sostenimiento de la Brigada',
    composicion: 'Compañía de Logística sobre camiones MB 1017 y ambulancias Piraña 6×6.',
    fuente: `${AP1}: «Batallón Logístico» y «Compañía de Transportes» (MB 1017-5) — ✎ a nivel Brigada, `
      + 'una compañía.',
  }),

  // ── La BRIGADA MOTORIZADA como unidad de maniobra de la DIVISIÓN ─────
  mot_brig: unid('mot_brig', 'BRIG. MOT.', 'brigada', 'motorizada', {
    papel: 'Brigada Motorizada sobre Piraña',
    composicion: 'Batallones de Infantería sobre MOWAG Piraña 8×8, G.A.C. (105/155), Cía. de Morteros '
      + '120 sobre Piraña, Cía. A/B (TOW/SPIKE), Cía. de Ingenieros independiente, Batería AA, '
      + 'Pelotón de exploración, Telecomunicaciones y Logística.',
    medios: 'MOWAG Piraña 8×8, misiles TOW/SPIKE y artillería remolcada',
    repetible: true,
    fuente: `${ARMADA}: se arma con los batallones sobre Piraña del REG. MOT. REF. (Apéndice 1) y lo que `
      + 'el Apéndice 2 da a la División Motorizada. 📕 RDO-20001, Art. 128.',
    nota: '✎ Cuántas brigadas tiene la División sale de las fichas rojas del calco (o del selector).',
  }),

  // ── Los apoyos de la DIVISIÓN MOTORIZADA ────────────────────────────
  mot_ga_div: unid('mot_ga_div', 'G.A. DIV. 155', 'batallon', 'artilleria', {
    papel: 'Fuego de la División: contrabatería y profundidad',
    composicion: 'Grupo de Artillería divisionario con obuses remolcados SOLTAM M-71 de 155 mm.',
    piezaId: 'soltam71',
    fuente: `${AP2}: 362 SOLTAM M-71 155 mm · ✎ que la División tenga un grupo propio lo pone la app.`,
  }),
  mot_rayo: unid('mot_rayo', 'BAT. SLM FAMAE / RAYO', 'compania', 'lanzacohetes', {
    papel: 'Lanzacohetes múltiple de la División',
    composicion: 'Batería de lanzacohetes múltiples SLM FAMAE / RAYO (160 y 306 mm) sobre MAN 6×6.',
    piezaId: 'rayo',
    fuente: `${AP2}: «SLM FAMAE — lanzacohetes múltiple … sobre un camión MAN 6×6 con capacidad de lanzar `
      + 'cohetes de 160 mm y 306 mm».',
  }),
  mot_bat_ing: unid('mot_bat_ing', 'BAT. ING.', 'batallon', 'ingenieria', {
    papel: 'Brechas y contramovilidad de la División',
    composicion: 'Batallón de ingenieros: barreminas, contramovilidad y minadores sobre Piraña.',
    fuente: '📕 RDO-20001, Tabla 3 (Art. 252): «División — Batallón de ingenieros».',
  }),
  mot_aa_div: unid('mot_aa_div', 'G. AA. (GDF-007 / MISTRAL)', 'batallon', 'antiaerea', {
    papel: 'Defensa antiaérea de la División',
    composicion: 'Grupo antiaéreo con cañones Oerlikon GDF-007 (radar Skyguard), M167 VADS y MISTRAL.',
    fuente: `${AP2}: 52 GDF-007 con Skyguard III, 66 M167 VADS, 750 MISTRAL.`,
  }),
  mot_esc_expl: unid('mot_esc_expl', 'ESC. EXPL. MOT.', 'compania', 'caballeria', {
    papel: 'Exploración de la División',
    composicion: 'Escuadrón de exploración de motos, cuadriciclos y vehículos ligeros.',
    fuente: '📕 RDO-20001, Art. 1628 · '
      + `${AP2}: 200 Honda XR 250 y 200 Honda Rancher «Reconocimientos», HMMWV y AIL Storm.`,
  }),
}

// ------------------------------------------------------------
// TEXTOS QUE SE REPITEN.
// ------------------------------------------------------------
const SIN_TANQUES = '⚠️ OJO: acá NO hay tanques. Si en el ejercicio aparecen LEOPARD, lo que tenés enfrente '
  + 'es la Brigada Acorazada (o la División Acorazada), no una unidad motorizada.'
const VELOCIDAD = '📕 Anexo 2: la Piraña es «mecanizada a ruedas» —20 km/h campo traviesa de día, 60 por '
  + 'camino de 1.a clase— y la artillería y la logística sobre camión son «motorizada»: 10 km/h campo '
  + 'traviesa. Lo rápido que es por camino y lo lento que es fuera de él es lo que la ata a las rutas.'

// ------------------------------------------------------------
// EL ORBAT DE CADA OPCIÓN (se suma a ORBAT_POR_NIVEL).
//   `tipoFuerza: 'motorizada'` → el compilado pide los apoyos a `apoyosMot`.
//   `armada` → el aviso que reemplaza a «🟥 … la organización REAL del Apéndice 1».
// ------------------------------------------------------------
export const ORBAT_MOT = {
  brigada_mot: {
    id: 'brig_motorizada', nom: 'BRIGADA MOTORIZADA de RAGNAR', escalon: 'brigada', maniobraEscalon: 'batallon',
    tipoFuerza: 'motorizada',
    fuente: `${ARMADA}: se arma con los batallones sobre Piraña del Regimiento Motorizado Reforzado y el `
      + 'armamento que el Apéndice 2 da a la División Motorizada.',
    resumen: 'Ataca con sus Batallones de Infantería sobre MOWAG Piraña 8×8, apoyados por un G.A.C. de 3 '
      + 'baterías (105/155), la Cía. de Morteros 120 sobre Piraña, la Cía. A/B (TOW/SPIKE) y la Cía. de '
      + 'Ingenieros independiente. Sin tanques.',
    armada: '✎ El Apéndice 1 «Organización de RAGNAR» no trae una Brigada Motorizada: la app la ARMA con '
      + 'piezas documentadas — los batallones sobre Piraña del REG. MOT. REF. (Apéndice 1), los morteros de '
      + '120 y los antiaéreos sobre Piraña que el Apéndice 2 da «a la División Motorizada», la Cía. de '
      + 'ingenieros independiente de la Tabla 3 y la exploración motorizada del Art. 1628. 📕 Art. 128: '
      + '«puede formar parte de una brigada motorizada, con especial capacidad para atacar una posición '
      + 'defensiva organizada». Verificala contra la OGO de tu ejercicio.',
    marca: 'estimacion',
    maniobra: ['bat_pirana'],
    apoyo: ['mot_gac', 'mot_mort120', 'mot_ab', 'mot_ing', 'mot_aa', 'mot_expl', 'mot_tel', 'mot_log'],
    primerEscalon: ['bat_pirana'],
    decisiva: 'bat_pirana',
    repetible: 'bat_pirana',
    porQueReparto: '✎ Cuántos batallones tiene sale de las fichas rojas del calco (o del selector): todos '
      + 'menos uno van al primer escalón y el último queda como el que penetra o envuelve. No hay cambio de '
      + 'medio entre uno y otro —son todos sobre Piraña—: 📕 el esfuerzo principal se lo da el que tenga la '
      + 'mejor avenida, con los morteros de 120, la Cía. A/B y los ingenieros (Art. 1005-1006).',
    textos: {
      penetracion: {
        resumen: 'Los batallones sobre Piraña abren la brecha en la L.P.R.; el último batallón penetra por '
          + 'ella (OD), con los morteros de 120 y la Cía. A/B.',
        fuenteE2: '✎ El segundo escalón de la Brigada Motorizada es otro de sus batallones sobre Piraña: 📕 '
          + 'tres momentos —rompimiento inicial, desgaste de los flancos de la brecha y explotación (Art. '
          + '1062)—. A 5 km detrás del primer escalón (≈15 min a 20 km/h campo traviesa, Anexo 2).',
        variante: '📕 «Siempre que sea posible, conviene que sean múltiples» ejes (Art. 1065): con tres '
          + 'batallones, dos abren cada uno por su avenida y el tercero entra por la que rompa.',
        ojo: SIN_TANQUES,
        primero: 'Con los batallones de infantería sobre MOWAG Piraña 8×8, uno por avenida, saliendo del '
          + 'apresto lejano, desembarcando para el asalto (📕 Art. 127), y el G.A.C. batiendo nuestra L.P.R.',
      },
      frontal: {
        resumen: 'Los batallones sobre la línea —el del centro rompe— y una reserva tamaño compañía detrás.',
        primero: 'Con todos los batallones a la vez, desembarcados, después del fuego de preparación del '
          + 'G.A.C. y los morteros de 120.',
      },
      envolvimiento: {
        resumen: 'Los batallones amarran de frente y uno envuelve por el flanco sobre Piraña (esfuerzo '
          + 'principal).',
        ojo: '⚠️ El batallón que envuelve va por la avenida MÁS EXTERIOR del racimo — y, sobre ruedas, por '
          + 'la que tenga camino. Si el flanco que dejamos descubierto es el otro, cambiale la avenida a mano.',
        primero: 'De frente, con los batallones que AMARRAN y simulan ser el grueso — el golpe verdadero es '
          + 'el batallón que sale por el flanco sobre Piraña.',
      },
      desbordante: {
        resumen: 'Los batallones eluden nuestro frente por la dirección exterior, por camino; sólo una '
          + 'demostración queda de frente.',
        primero: 'De frente sólo con una DEMOSTRACIÓN. El grueso no nos busca de frente: lo encontramos en '
          + 'un flanco o, peor, en nuestra retaguardia — por la ruta.',
      },
      porQuePenetracion: '✎ Sin tanques, la Brigada Motorizada concentra lo que tiene en un frente '
        + 'estrecho: 📕 «especial capacidad para atacar una posición defensiva organizada» (Art. 128) y '
        + '«concentrar todo el poder de combate en esa vulnerabilidad» (Art. 1061). La OGO 01/35 es del '
        + 'escalón División Acorazada: con este enemigo, el CAE lo elegís vos.',
    },
  },

  division_mot: {
    id: 'div_motorizada', nom: 'DIVISIÓN MOTORIZADA de RAGNAR', escalon: 'division', maniobraEscalon: 'brigada',
    tipoFuerza: 'motorizada',
    fuente: `${ARMADA}. ${AP2} sí la nombra: las MOWAG Piraña «pertenecen a la División Motorizada».`,
    resumen: 'Ataca con sus Brigadas Motorizadas sobre MOWAG Piraña 8×8, apoyadas por el Grupo de '
      + 'Artillería divisionario de 155 mm (SOLTAM M-71), la batería de lanzacohetes SLM FAMAE / RAYO, el '
      + 'Batallón de Ingenieros y el Grupo AA. Sin tanques.',
    armada: '✎ RAGNAR TIENE una División Motorizada —el Apéndice 2 dice que las 404 MOWAG Piraña «pertenecen '
      + 'a la División Motorizada»— pero el Apéndice 1 no trae su organigrama. La app la ARMA con Brigadas '
      + 'Motorizadas (Art. 128), el Batallón de Ingenieros de la Tabla 3 y la artillería, los lanzacohetes '
      + 'y la antiaérea del Apéndice 2; el REG. TELECOM., el REG. LOG. DIV. y el PLTN. AV. son los mismos de '
      + 'la División Acorazada (Apéndice 1). Verificala contra la OGO de tu ejercicio.',
    marca: 'estimacion',
    maniobra: ['mot_brig'],
    apoyo: ['mot_ga_div', 'mot_rayo', 'mot_bat_ing', 'mot_aa_div', 'mot_esc_expl', 'rtel', 'rlog', 'ptav'],
    primerEscalon: ['mot_brig'],
    decisiva: 'mot_brig',
    repetible: 'mot_brig',
    porQueReparto: '✎ Cuántas brigadas tiene sale de las fichas rojas del calco (o del selector): todas '
      + 'menos una van al primer escalón y la última es el segundo escalón (OD), como la 1ra. Brigada '
      + 'Acorazada en la OGO 01/35. Acá no hay cambio de medio —todas son sobre Piraña—: la diferencia la '
      + 'pone la artillería divisionaria y los ingenieros, que se le dan a la que penetra.',
    textos: {
      penetracion: {
        resumen: 'Las brigadas motorizadas de primer escalón abren la brecha en la L.P.R.; la última '
          + 'brigada penetra por ella (OD) con el fuego del G.A. DIV. 155 y el SLM RAYO.',
        fuenteE2: '✎ El segundo escalón de la División Motorizada es otra brigada sobre Piraña, como la 1ra. '
          + 'Brigada Acorazada en la OGO 01/35 pero sin LEOPARD: 📕 tres momentos —rompimiento, desgaste de '
          + 'los flancos de la brecha y explotación (Art. 1062)—. A 5 km detrás del primer escalón.',
        variante: '📕 «Siempre que sea posible, conviene que sean múltiples» ejes (Art. 1065): las brigadas '
          + 'de primer escalón atacan cada una por su avenida.',
        ojo: SIN_TANQUES + ' ' + VELOCIDAD,
        primero: 'Con las brigadas motorizadas de primer escalón (Piraña 8×8, TOW/SPIKE, artillería '
          + 'remolcada), una por avenida, después del fuego del G.A. DIV. 155 y del SLM RAYO sobre nuestra '
          + 'L.P.R. y nuestra artillería.',
      },
      frontal: {
        resumen: 'Las brigadas sobre la línea —la del centro rompe— y una reserva tamaño regimiento detrás.',
        primero: 'Con TODO a la vez: las brigadas desembarcadas en todo el frente, después de un fuego de '
          + 'preparación intenso del G.A. DIV. y los lanzacohetes.',
      },
      envolvimiento: {
        resumen: 'Las brigadas de primer escalón amarran de frente; la última envuelve por el flanco '
          + '(esfuerzo principal).',
        ojo: '⚠️ La brigada que envuelve va por la avenida MÁS EXTERIOR del racimo — y, sobre ruedas, por '
          + 'la que tenga camino. Si el flanco que dejamos descubierto es el otro, cambiale la avenida a mano.',
        primero: 'De frente, con las brigadas que AMARRAN y simulan ser el grueso — el golpe verdadero sale '
          + 'por el flanco, sobre ruedas y por camino.',
      },
      desbordante: {
        resumen: 'Las brigadas eluden nuestro frente por la dirección exterior, por las rutas; sólo una '
          + 'demostración queda de frente.',
        primero: 'De frente sólo con una DEMOSTRACIÓN. El grueso no nos busca de frente: lo encontramos en '
          + 'un flanco o, peor, en nuestra retaguardia — 📕 la Piraña hace 60 km/h por camino (Anexo 2).',
      },
      porQuePenetracion: '✎ Sin tanques, la División Motorizada concentra sus brigadas y su artillería '
        + 'divisionaria en un frente estrecho para abrir la brecha: 📕 Art. 128 y Art. 1061. La OGO 01/35 '
        + 'describe a la División ACORAZADA: con la Motorizada, el CAE lo elegís vos.',
    },
  },
}

// ------------------------------------------------------------
// LAS FILAS DEL SELECTOR (se suman a NIVELES de esquemasRojo, `x2`). Las
// distancias son las del mismo escalón acorazado: dependen del ALCANCE DE
// NUESTRAS ARMAS, no del tamaño ni del vehículo del atacante.
// ------------------------------------------------------------
export const NIVELES_MOT = {
  brigada_mot: { nom: 'Brigada Motorizada', maniobra: 'batallon', marca: 'estimacion', frente: [2, 4.5],
    kmE2: 11, prof: 24, k: 0.85,
    nota: '✎ El cuadro del PMTD 2017 NO trae Brigada: el frente (2-4,5 km) y las profundidades son los '
      + 'mismos que los de la Brigada Acorazada, interpolados. Revisalos.' },
  division_mot: { nom: 'División Motorizada', maniobra: 'brigada', marca: 'estimacion', frente: [3, 6],
    kmE2: 12, prof: 28, k: 1,
    nota: '📗 El frente (3-6 km) sí es el de la División del cuadro del PMTD 2017; lo ✎ es la organización.' },
}

/** El escalón «de verdad» de cada opción (para el Manual de Fuerzas Contrarias, que no las tiene). */
export const BASE_MOT = { brigada_mot: 'brigada', division_mot: 'division' }

/** Mete las opciones motorizadas en la lista del selector, cada una al lado de su escalón. */
export function listaConMotorizadas(ids = []) {
  const out = []
  for (const id of ids) {
    out.push(id)
    if (id === 'brigada') out.push('brigada_mot')
    if (id === 'division') out.push('division_mot')
  }
  return out
}

// ------------------------------------------------------------
// LOS APOYOS QUE SE DIBUJAN (mismo contrato que apoyosBrigada / apoyosRegimiento
// de esquemasRojo.js). REGLA DE ORO de la hoja P.D.: LA ARTILLERÍA VA ATRÁS de
// lo que apoya, siempre (medida desde el primer escalón o más lejos que él).
// ------------------------------------------------------------
const GAC_MOT = (deQuien, o = {}) => ({
  id: 'gac', nom: 'G.A.C.', desc: `Grupo de Artillería de Campaña ${deQuien} (105 mm OTO Melara / 155 mm SOLTAM)`,
  rol: 'artilleria', ancla: 'unidad', desde: 'e1', km: [1, 3],
  escalon: 'batallon', arma: 'artilleria', tipo: 'unidad', piezaId: 'soltam71',
  fuente: `${AP1}, Regimiento Motorizado Reforzado — «Grupo de Artillería de Campaña» (modelo). 📕 El cuadro `
    + 'del RC-02-107 deja al grupo 1 a 3 km DETRÁS de su primer escalón: la artillería va atrás de lo que '
    + 'apoya, siempre.',
  nota: '✎ El Apéndice 1 le da piezas de 105 (OTO Melara, 10,6 km) y de 155 (SOLTAM M-71, 23 km): se dibuja '
    + 'el alcance del 155, que es el peor caso para nosotros. Si el ejercicio dice que es de 105, el arco '
    + 'real es menos de la mitad.',
  ...o,
})

const AB_MOT = (deQuien) => ({
  id: 'ab', nom: 'CÍA. A/B (TOW / SPIKE)', desc: `Compañía Antiblindaje ${deQuien} (TOW / SPIKE sobre HMMWV)`,
  rol: 'anticarro', ancla: 'ppal', desde: 'entre', km: null,
  escalon: 'compania', arma: 'antitanque', tipo: 'unidad',
  fuente: `${AP1}: «Cía. Antiblindaje de misiles TOW sobre HMMWV» · ${AP2}: SPIKE «LR y ER en los Humvees». `
    + '📕 La protección antiblindaje es parte de la protección del ataque (RDO-20001, Art. 886).',
  ojo: '⚠️ Va entre los escalones sobre el eje principal; si un flanco queda amenazado, movela vos.',
})

function apoyosBrigadaMot(nv) {
  const k = nv?.k || 0.85
  const p = []
  p.push(GAC_MOT('de la Brigada Motorizada (3 baterías)', { principal: true }))
  p.push({
    id: 'mort120', nom: 'CÍA. MORT. 120 (PIRAÑA)', desc: 'Compañía de Morteros de 120 mm sobre Piraña',
    rol: 'artilleria', ancla: 'unidad', desde: 'e1', km: [0.5, 1.5],
    escalon: 'compania', arma: 'morteros', tipo: 'unidad', piezaId: 'mort120',
    fuente: `${AP2}: Piraña «portamorteros de 120 mm … de la División Motorizada».`,
    nota: '✎ Va CON los batallones, 1 km detrás del primer escalón. Con 7 km de alcance NO llega a '
      + 'nuestra posición desde el apresto lejano: empieza a batirnos cuando los batallones avanzan.',
  })
  p.push(AB_MOT('de la Brigada'))
  p.push({
    id: 'ing', nom: 'CÍA. ING. IND.', desc: 'Compañía de Ingenieros independiente de la Brigada (brechas)',
    rol: 'ingenieria', ancla: 'unidad', desde: 'avanzado', km: [7.5, 8.5], frac: 0.5,
    escalon: 'compania', arma: 'ingenieria', tipo: 'unidad',
    fuente: '📕 RDO-20001, Tabla 3: «Brigada — Compañía de ingenieros independiente» · «Durante el trabajo '
      + 'de aproximación, cobra importancia la acción de los medios de ingenieros […] abriendo brechas» '
      + '(Art. 928).',
  })
  p.push({
    id: 'daa', nom: 'BAT. AA.', desc: 'Batería antiaérea (Piraña 20 mm / MISTRAL)',
    rol: 'antiaerea', ancla: 'ppal', desde: 'avanzado', km: [9, 11], frac: 0.5,
    escalon: 'compania', arma: 'antiaerea', tipo: 'unidad',
    fuente: `${AP2}: Piraña antiaéreos de 20 mm y MISTRAL sobre camión.`,
    nota: '✎ Cubriendo el G.A.C. y los puestos de mando.',
  })
  p.push({
    id: 'rec', nom: 'PEL. EXPL. MOT.', desc: 'Pelotón de exploración motorizado (motos y vehículos ligeros)',
    rol: 'reconocimiento', ancla: 'ppal', desde: 'avanzado', km: [4, 6], frac: 0.5,
    escalon: 'seccion', arma: 'caballeria', tipo: 'unidad',
    fuente: '📕 RDO-20001, Art. 1628: explora «en forma rápida, y a medianas distancias, mediante la '
      + `infiltración» con motos y vehículos ligeros · ${AP2}: Honda XR 250.`,
    nota: '✎ Va DELANTE del grueso, metido en nuestra zona de fuegos mixtos (📕 400 m a 6 km, Art. 1306): '
      + 'es la ficha con la que chocamos primero.',
  })
  p.push({
    id: 'pcbat', nom: 'PC BAT.', desc: 'Puesto de mando de los batallones sobre Piraña',
    rol: 'pc', ancla: 'unidad', desde: 'e1', km: [1.5, 2.5],
    escalon: 'batallon', arma: 'ninguna', tipo: 'pc',
    fuente: '📄 Apéndice 1: el Comando (CG) de cada batallón.',
    nota: '✎ El RDO-20001 no da distancias de PC: 2 km detrás de su unidad, en la zona de apresto.',
  })
  p.push({
    id: 'pcbrig', nom: 'PC BRIG. MOT.', desc: 'Puesto de mando de la Brigada Motorizada',
    rol: 'pc', ancla: 'ppal', desde: 'e2', km: [1.5, 2.5],
    escalon: 'brigada', arma: 'ninguna', tipo: 'pc',
    fuente: '📕 El PC del comandante va en la faja del esfuerzo principal (Art. 1006).',
  })
  p.push({
    id: 'tel', nom: 'CÍA. TELECOM.', desc: 'Compañía de Telecomunicaciones de la Brigada',
    rol: 'pc', ancla: 'ppal', desde: 'e2', km: [2, 3],
    escalon: 'compania', arma: 'comunicaciones', tipo: 'unidad',
    fuente: '✎ Igual a la de la 1ra. Brigada Acorazada (Apéndice 1).',
    nota: '✎ Con el PC: es la que lo enlaza. Blanco de alto valor.',
  })
  p.push({
    id: 'log', nom: 'CÍA. LOG.', desc: 'Compañía de Logística de la Brigada (MB 1017, ambulancias Piraña)',
    rol: 'logistica', ancla: 'retaguardia', desde: 'avanzado', km: esc2([20, 25], k), frac: 0.5,
    escalon: 'compania', arma: 'logistica', tipo: 'unidad',
    fuente: `${AP1}: Batallón Logístico y Cía. de Transportes (MB 1017-5) — ✎ a nivel Brigada, una compañía.`,
    nota: 'Va FUERA de los ejes: las rutas son de los escalones de combate. ⚠️ La Brigada NO tiene '
      + 'aviación ni regimiento logístico propios: eso es de la División.',
  })
  return p
}

function apoyosDivisionMot(nv) {
  const k = nv?.k || 1
  const p = []
  p.push(GAC_MOT('de las Brigadas Motorizadas'))
  p.push({
    id: 'gadiv', nom: 'G.A. DIV. 155', desc: 'Grupo de Artillería divisionario (obuses SOLTAM M-71 155 mm)',
    rol: 'artilleria', ancla: 'ppal', desde: 'avanzado', km: [10, 13], frac: 0.5, principal: true,
    escalon: 'batallon', arma: 'artilleria', tipo: 'unidad', piezaId: 'soltam71',
    fuente: `${AP2}: 362 SOLTAM M-71 155 mm.`,
    nota: '✎ Detrás de las brigadas de primer escalón (que aprestan a 7 km) y, con 23 km de alcance, '
      + 'batiendo todo nuestro campo principal de combate y nuestra artillería.',
  })
  p.push({
    id: 'rayo', nom: 'BAT. SLM RAYO', desc: 'Batería de lanzacohetes SLM FAMAE / RAYO (160 y 306 mm)',
    rol: 'artilleria', ancla: 'ppal', desde: 'avanzado', km: [14, 18], frac: 0.3,
    escalon: 'compania', arma: 'lanzacohetes', tipo: 'unidad', piezaId: 'rayo',
    fuente: `${AP2}: SLM FAMAE sobre MAN 6×6 (cohetes de 160 y 306 mm) · alcance del RC-02-107 (RAYO 40 km).`,
    nota: '✎ Bien atrás: con 40 km de alcance bate nuestra profundidad sin acercarse.',
  })
  p.push(AB_MOT('de las brigadas'))
  p.push({
    id: 'ing', nom: 'BAT. ING.', desc: 'Batallón de Ingenieros de la División (brechas)',
    rol: 'ingenieria', ancla: 'unidad', desde: 'avanzado', km: [7.5, 8.5], frac: 0.5,
    escalon: 'batallon', arma: 'ingenieria', tipo: 'unidad',
    fuente: '📕 RDO-20001, Tabla 3: «División — Batallón de ingenieros» · «Durante el trabajo de '
      + 'aproximación, cobra importancia la acción de los medios de ingenieros […] abriendo brechas» '
      + '(Art. 928).',
  })
  p.push({
    id: 'daa', nom: 'G. AA.', desc: 'Grupo antiaéreo (GDF-007 / M167 VADS / MISTRAL)',
    rol: 'antiaerea', ancla: 'ppal', desde: 'avanzado', km: [9, 11], frac: 0.5,
    escalon: 'batallon', arma: 'antiaerea', tipo: 'unidad',
    fuente: `${AP2}: 52 Oerlikon GDF-007 (Skyguard III), 66 M167 VADS, 750 MISTRAL.`,
    nota: '✎ Cubriendo la artillería divisionaria y los puestos de mando.',
  })
  p.push({
    id: 'rec', nom: 'ESC. EXPL. MOT.', desc: 'Escuadrón de exploración motorizado (motos, cuadriciclos, HMMWV)',
    rol: 'reconocimiento', ancla: 'ppal', desde: 'avanzado', km: [4, 6], frac: 0.5,
    escalon: 'compania', arma: 'caballeria', tipo: 'unidad',
    fuente: `📕 RDO-20001, Art. 1628 · ${AP2}: 200 Honda XR 250 y 200 Honda Rancher «Reconocimientos».`,
    nota: '✎ Va DELANTE del grueso, metido en nuestra zona de fuegos mixtos (📕 400 m a 6 km, Art. 1306).',
  })
  p.push({
    id: 'pcbrig', nom: 'PC BRIG. MOT.', desc: 'Puesto de mando de las brigadas motorizadas',
    rol: 'pc', ancla: 'unidad', desde: 'e1', km: [1.5, 2.5],
    escalon: 'brigada', arma: 'ninguna', tipo: 'pc',
    nota: '✎ El RDO-20001 no da distancias de PC: 2 km detrás de su brigada, en la zona de apresto.',
  })
  p.push({
    id: 'pcdiv', nom: 'PC DIV. MOT.', desc: 'Puesto de mando de la División Motorizada',
    rol: 'pc', ancla: 'ppal', desde: 'avanzado', km: esc2([15, 18], k), frac: 0.5,
    escalon: 'division', arma: 'ninguna', tipo: 'pc',
    fuente: '📄 Apéndice 1: el REG. TELECOM. divisionario lo enlaza.',
    nota: '✎ Fuera del alcance de nuestra artillería media; el RDO-20001 no da la distancia.',
  })
  p.push({
    id: 'av', nom: 'PLTN. AV.', desc: 'Pelotón de Aviación (AS 350 B3, MD 530, AS 532 Cougar)',
    rol: 'logistica', ancla: 'retaguardia', desde: 'avanzado', km: esc2([18, 22], k), frac: 0.5,
    escalon: 'seccion', arma: 'aviacion', tipo: 'unidad',
    fuente: '📄 Apéndice 1, D.- Pelotón de Aviación (el de la División Acorazada).',
    nota: '✎ Zona de reunión de helicópteros fuera de los ejes.',
  })
  p.push({
    id: 'log', nom: 'REG. LOG. DIV.', desc: 'Regimiento Logístico Divisionario',
    rol: 'logistica', ancla: 'retaguardia', desde: 'avanzado', km: esc2([20, 25], k), frac: 0.5,
    escalon: 'regimiento', arma: 'logistica', tipo: 'unidad',
    fuente: '📄 Apéndice 1 (Batallón Logístico, Cía. de Transportes MB 1017-5).',
    nota: 'Va FUERA de los ejes: las rutas son de los escalones de combate. ⚠️ Toda la División va sobre '
      + 'ruedas: sus columnas de abastecimiento dependen de los caminos — blanco para nuestra interdicción.',
  })
  return p
}

/** Los apoyos dibujables de la opción motorizada (`org` = la salida de organizacionDeNivel). */
export function apoyosMot(nv, org) {
  return org?.escalon === 'division' ? apoyosDivisionMot(nv) : apoyosBrigadaMot(nv)
}
