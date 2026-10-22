// El tema del grupo se lee del «Nombre del proyecto» del PDF que sube el alumno.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const ini = html.indexOf('function eemTemaDelPdf(texto){');
const source = html.slice(ini, html.indexOf('\nwindow.eemTemaDelPdf', ini));
const ctx = {}; vm.createContext(ctx); vm.runInContext(source, ctx);

test('formato del perfil mínimo (Texto Proyectos 2026, cap. IV)', () => {
  const t = 'PERFIL MÍNIMO DE PROYECTOS EN GENERAL I.- PARTE 1 ASPECTOS GENERALES DEL PROYECTO. ' +
    'A.- Nombre del proyecto. Mejora del Sistema de Saneamiento del RA-5 “MY. VERGARA". ' +
    'B.- Entidad ejecutora del proyecto. 1.- Nombre de la institución.';
  assert.equal(ctx.eemTemaDelPdf(t), 'Mejora del Sistema de Saneamiento del RA-5 “MY. VERGARA"');
});
test('salta el índice (puntos guía o sólo el número de página)', () => {
  const t = 'ÍNDICE A.- Nombre del proyecto .......... 3 B.- Entidad ejecutora ....... 3 ' +
    'A.- Nombre del proyecto 4 B.- Entidad ejecutora 4 ' +
    'I.- PARTE 1 A.- Nombre del proyecto: Construcción de una cancha multifuncional en Sorata B.- Entidad ejecutora del proyecto';
  assert.equal(ctx.eemTemaDelPdf(t), 'Construcción de una cancha multifuncional en Sorata');
});
test('sin rótulo no inventa nada', () => {
  assert.equal(ctx.eemTemaDelPdf('Un trabajo sin el rótulo pedido por la guía.'), '');
  assert.equal(ctx.eemTemaDelPdf(''), '');
});
