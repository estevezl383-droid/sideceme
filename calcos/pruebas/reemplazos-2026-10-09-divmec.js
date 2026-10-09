// Reemplazos del 2026-10-09 sobre calcos/assets/index-membrete-20261009.js →
// index-divmec-20261009.js. Lo pidió Sergio: «SOMOS LA DIV MEC 1». La unidad considerada
// es la de la Orden (campo «Unidad considerada (quiénes somos)»: DIV.MEC.-1), no un RCB-1
// por defecto. Con eso el membrete sale como el de la Escuela:
//   CE-I / DIV.MEC.-1  CG. VIACHA D-15 (2300) / EMO/SEC-III / No. 001/SMM
// El campo nuevo de la Orden queda para el caso en que la unidad considerada sea OTRA
// (entonces la de arriba pasa a ser su escalón superior).
// No se toca calcos/membrete/v1: el compilado le pasa la unidad con sincronizar().
module.exports = [
  {
    nombre: 'DIV.MEC.-1 · el campo de la Orden vuelve a ser la unidad considerada',
    viejo: 'f.jsx("span",{children:"Unidad que expide la Orden"}),f.jsx("input",{style:Cn.inp,value:B.unidad||""',
    nuevo: 'f.jsx("span",{children:"Unidad considerada (quiénes somos)"}),f.jsx("input",{style:Cn.inp,value:B.unidad||""',
    veces: 1,
  },
  {
    nombre: 'DIV.MEC.-1 · el campo nuevo es sólo para OTRA unidad considerada',
    viejo: 'f.jsx("span",{children:"Unidad considerada (quiénes somos)"}),f.jsx("input",{style:Cn.inp,value:B.unidadPropia||"",placeholder:SIDMembrete.UNIDAD_CONSIDERADA_POR_DEFECTO,',
    nuevo: 'f.jsx("span",{children:"Otra unidad considerada (vacío = la de arriba)"}),f.jsx("input",{style:Cn.inp,value:B.unidadPropia||"",placeholder:"vacío = la de arriba",',
    veces: 1,
  },
  {
    nombre: 'DIV.MEC.-1 · la ayuda del membrete, sin RCB-1 por defecto',
    viejo: ' de TODOS los documentos militares: escalón superior (la unidad que expide la Orden), unidad considerada con su CG y la hora táctica de la Línea de Tiempo, EMO/SEC de la pestaña y el número correlativo de la sección con las iniciales del redactor. Sin unidad considerada se toma la ",SIDMembrete.UNIDAD_CONSIDERADA_POR_DEFECTO,"."]})',
    nuevo: ' de TODOS los documentos militares: escalón superior, unidad considerada con su CG y la hora táctica de la Línea de Tiempo, EMO/SEC de la pestaña y el número correlativo de la sección con las iniciales del redactor."]})',
    veces: 1,
  },
  {
    nombre: 'DIV.MEC.-1 · la unidad considerada del membrete es la de la Orden',
    viejo: 'SIDMembrete.sincronizar({unidades:dn,capas:ve,g3:Ya,picb:$i,hojasG:Kr,autor:zo,ordenSup:Tn,puesto:Ha})',
    nuevo: 'SIDMembrete.sincronizar({unidades:dn,capas:ve,g3:Ya,picb:$i,hojasG:Kr,autor:zo,ordenSup:Tn,puesto:Ha,unidadPropia:Tn?.unidadPropia||Tn?.unidad||""})',
    veces: 1,
  },
]
