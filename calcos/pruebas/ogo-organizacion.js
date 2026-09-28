// Organización de la tarea de la OGO 01/35 del ejercicio «ARMAS», como la guarda
// la Mesa en «Documentos del ejercicio». La usan ingenieria-fuerza.js (Node) y
// e2e/ingenieria-tiempo.js (Chromium).
// Fragmento de la OGO 01/35 como la guarda la Mesa al leer el .docx (Markdown).
// Se agrega, en «Fuerzas enemigas», la compañía de ingenieros de RAGNAR: no
// tiene que contar (es del enemigo).
const OGO_MD = [
  '# 1.- OGO 01-35 (PICB)',
  'ORGANIZACIÓN DE LA TAREA.',
  'SITUACIÓN.',
  'Fuerzas enemigas.',
  'Curso de Acción más probable.',
  'Cía. de Ingenieros Mecanizados «ACONCAGUA»',
  'Compañía de Ingenieros (barreminas, contramovilidad y minador sobre Piraña).',
  'Fuerzas amigas.',
  'MISIÓN.',
  'EJECUCIÓN.',
  'Ingeniería.',
  'En la primera fase la prioridad de trabajo será principalmente de contra movilidad mediante la instalación de fajas de minas y la prioridad de esfuerzo a las unidades de maniobra OC1, OC2, OC3 y OC4, en ese orden.',
  'COMANDO Y COMUNICACIONES.',
  '## Tabla 1',
  '',
  '| RCB-1 “CALAMA” | RCB-2 “TARAPACÁ” | RIM-8 “AYACUCHO” | RIM-23 “MAX TOLEDO” |',
  '| --- | --- | --- | --- |',
  '| Edrón. Tq. “A”<br>Edrón. Tq. “B”<br>Edrón. Tq. “C”<br>ERM. “D”<br>Edrón. C y S. | ERM. “A”<br>ERM. “B”<br>ERM. “C”<br>Edrón. C y S. | Comp. Inf. Mec. “A”<br>Comp. Inf. Mec. “B”<br>Comp. Inf. Mec. “C”<br>Comp. Inf. Ap. “D”<br>Comp. C y S. | Comp. Inf. Mec. “A”<br>Comp. Inf. Mec. “B”<br>Comp. Inf. Mec. “C”<br>Comp. Inf. Ap. “D”<br>Comp. C y S. |',
  '| RIAT-30 “MURILLO” | RAM-2<br>“BOLIVAR” | RAA-6<br>“BILBAO RIOJA” | BATING. MEC.- II “ROMAN” |',
  '| Comp. Inf. AT. “A”<br>Comp. Inf. AT. “B”<br>Comp. Inf. AT. “C”<br>Comp. Inf. AT. “D”<br>Comp. C y S.<br> | Bat. Art. Mec. “A”<br>Bat. Art. Mec. “B”<br>Bat. Art. Mec. “C”<br>Bat. Cmdo.<br>Bat. C y S. | Bat. AA. “A”<br>Bat. AA. “B”<br>Bat. AA. “C”<br>Bat. Cmdo.<br>Bat. C y S. | Comp. Ing. Comb. “A”<br>Comp. Ing. Comb. “B”<br>Comp. Ing. Eq. Pes.<br>Comp. Ing. Puentes<br>Comp. Mtto. Ing.<br>Comp. C y S. |',
  '| BAT. LOG. - I “HEROICAS RABONAS” | BAT. COM. MEC. - I “VIDAURRE” | COMP. ICIA. - I “USTARIZ” | BAJO CONTROL |',
  '| Comp. Abtto.<br>Comp. Mtto.<br>Comp. Transp.<br>Comp. San.<br>Comp. C y S. | Comp. Telecom. “A”<br>Comp. Telecom. “B”<br>Comp. Telecom. “C”<br>Comp. Radares<br>Comp. C y S. | Secc. ICIA. Hum.<br>Secc. ICIA. Ae.<br>Secc. ICIA. Elect.<br>Secc. C y S. | Comp. Av. Ejto. “Cnl. Lopez” |',
].join('\n')

// La misma Organización de la tarea como sale del Word en texto plano: la
// tabla se aplana celda por celda (el orden de las columnas se pierde).
const OGO_WORD = [
  'ORDEN GENERAL DE OPERACIONES No. 01/35',
  '\t\tORGANIZACIÓN DE LA TAREA.',
  ...['RCB-1 “CALAMA”', 'RCB-2 “TARAPACÁ”', 'RIM-8 “AYACUCHO”', 'RIM-23 “MAX TOLEDO”', 'Comp. Inf. Mec. “A”', 'Comp. C y S.', 'RIAT-30 “MURILLO”', 'RAM-2', '“BOLIVAR”', 'RAA-6', '“BILBAO RIOJA”', 'BATING. MEC.- II “ROMAN”', 'Comp. Inf. AT. “A”', 'Comp. C y S.', 'Bat. Art. Mec. “A”', 'Bat. Cmdo.', 'Bat. C y S.', 'Comp. Ing. Comb. “A”', 'Comp. Ing. Comb. “B”', 'Comp. Ing. Eq. Pes.', 'Comp. Ing. Puentes', 'Comp. Mtto. Ing.', 'Comp. C y S.', 'BAT. LOG. - I “HEROICAS RABONAS”', 'Comp. Mtto.', 'Comp. Av. Ejto. “Cnl. Lopez”'].map((x) => '\t\t' + x),
  'SITUACIÓN.',
  'Fuerzas enemigas.',
  'Cía. de Ingenieros Mecanizados «ACONCAGUA»',
  'Fuerzas amigas.',
  'Tareas a las Unidades de maniobra.',
  // Una frase que nombra una compañía ya contada: no se cuenta dos veces.
  'Comp. Ing. Comb. “A” en apoyo directo a la OC1.',
  'Cía. Ing. apoya a la OC1 con prioridad de trabajo.',
].join('\n')

module.exports = { OGO_MD, OGO_WORD }
