# 🟥 Brigada Motorizada y División Motorizada de RAGNAR (Manual Rojo)

**11-11-2026 — Sergio:** «necesito que diseñes brigadas y divisiones motorizadas en la aplicación, tengo puras
brigadas acorazadas; elaborame las plantillas doctrinales para brigadas motorizadas para que pueda tener esas
opciones».

Dónde: G-2 → PICB → Evaluar la amenaza → hoja **P.D.** → «🟥 Elaborar en base al MANUAL ROJO» →
**1 · A qué enemigo, y a qué nivel** → *Nivel de planeamiento*. El selector ahora tiene seis filas:

| Opción | Organización | Origen |
| --- | --- | --- |
| Regimiento ✎ | REGIMIENTO MOTORIZADO REFORZADO | 📄 Apéndice 1 |
| Brigada ✎ | 1RA. BRIGADA ACORAZADA | 📄 Apéndice 1 |
| **Brigada Motorizada ✎** | **BRIGADA MOTORIZADA de RAGNAR** | ✎ armada (ver abajo) |
| División | DIVISIÓN ACORAZADA de RAGNAR | 📄 Apéndice 1 + OGO 01/35 |
| **División Motorizada ✎** | **DIVISIÓN MOTORIZADA de RAGNAR** | ✎ armada (ver abajo) |
| Cuerpo de Ejército ✎ | genérico, sin ORBAT | — |

## Por qué «armada» (✎) y no «del Apéndice 1» (📄)

El Apéndice 1 «Organización de RAGNAR» SÓLO trae la División Acorazada. El Apéndice 2 dice que las 404 MOWAG
Piraña (con 50 portamorteros de 120 mm y 40 antiaéreos de 20 mm) «pertenecen a la División Motorizada»: RAGNAR la
tiene, pero sin organigrama. La app la arma con piezas que sí están documentadas y lo dice en pantalla:

**Brigada Motorizada** (maniobra con batallones; cuántos, del calco — por defecto 3):
- 📄 BAT. INF. MOT. sobre MOWAG Piraña 8×8 (los del REG. MOT. REF., Apéndice 1) — todos menos el último al primer
  escalón, el último penetra/envuelve (OD).
- G.A.C. (105 OTO Melara / 155 SOLTAM, modelo del REG. MOT. REF.; se dibuja el arco del 155: 23 km).
- CÍA. MORT. 120 (PIRAÑA) — 📄 Apéndice 2.
- CÍA. A/B (TOW / SPIKE) sobre HMMWV — 📄 Apéndices 1 y 2.
- CÍA. ING. IND. — 📕 RDO-20001, Tabla 3: «Brigada — Compañía de ingenieros independiente».
- BAT. AA. (Piraña 20 mm / MISTRAL) — 📄 Apéndice 2.
- PEL. EXPL. MOT. (motos y vehículos ligeros) — 📕 Art. 1628 · 📄 Apéndice 2 (Honda XR 250).
- PC BAT., PC BRIG. MOT., CÍA. TELECOM., CÍA. LOG. (MB 1017).

**División Motorizada** (maniobra con brigadas motorizadas; cuántas, del calco — por defecto 3):
- BRIG. MOT. 1…n — todas menos la última al primer escalón, la última es el segundo escalón (OD).
- G.A.C. de las brigadas, **G.A. DIV. 155** (SOLTAM M-71, 📄 362 piezas), **BAT. SLM RAYO** (📄 SLM FAMAE sobre MAN 6×6).
- **BAT. ING.** — 📕 Tabla 3: «División — Batallón de ingenieros».
- G. AA. (GDF-007 / M167 VADS / MISTRAL), ESC. EXPL. MOT., CÍA. A/B.
- PC BRIG. MOT., PC DIV. MOT., PLTN. AV., REG. LOG. DIV. (los de la División Acorazada, 📄 Apéndice 1).

Sin LEOPARD, sin M109, sin BIBER/«ACONCAGUA»: eso es de la Brigada Acorazada. Las distancias de apresto (7 km,
segundo escalón a 11-12 km) son las mismas: dependen del alcance de NUESTRAS armas (Art. 1306), no del vehículo
del atacante. La artillería va siempre detrás de lo que apoya.

## Archivos

- `v1/motorizadas.mjs` — todo lo nuevo (unidades, ORBAT, filas del selector, apoyos que se dibujan).
- El compilado `assets/index-motorizadas-20261111.js` sólo lo enchufa (7 reemplazos reversibles,
  `pruebas/reemplazos-2026-11-11-motorizadas.js`, `pruebas/construir-motorizadas.js`).
- Prueba: `pruebas/e2e/motorizadas.cjs` (la Mesa real en Chrome).
