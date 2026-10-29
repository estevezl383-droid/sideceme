module.exports = [
  { nombre:'Controles y visibilidad de G-4 y G-1', viejo:'import {CursosEnemigos as SIDCursosEnemigos,', nuevo:'import {ProductosEM as SIDProductosEM,productoVisible as SIDProductoVisible,cambiarProducto as SIDCambiarProducto} from "../visibilidad/v1/productos-em.mjs?v=20261029-g4-g1";\nimport {CursosEnemigos as SIDCursosEnemigos,', veces:1 },
  { nombre:'Actualizar el filtro de instalaciones', viejo:'../visibilidad/v1/cursos.mjs?v=20261029"', nuevo:'../visibilidad/v1/cursos.mjs?v=20261029-g4-g1"', veces:1 },
  { nombre:'Los grupos debajo de los cursos propios', viejo:'planFuegos:SIDcursos.plan,ops:SIDcursos.ops})]}),f.jsxs(SIDPanelAI', nuevo:'planFuegos:SIDcursos.plan,ops:SIDcursos.ops}),f.jsx(SIDProductosEM,{react:je,ops:SIDcursos.ops,unidades:SIDcursos.unidades,catalogo:h8,verCapa:re,onVer:SIDcursos.cambiarCapa,onGrupo:SIDgrupo})]}),f.jsxs(SIDPanelAI', veces:1 },
  { nombre:'Contar las instalaciones guardadas', viejo:'cursos:{fases:Yn,activa:yt,g3:Ya,plan:planFuegos,ops:Lt,', nuevo:'cursos:{fases:Yn,activa:yt,g3:Ya,plan:planFuegos,ops:Lt,unidades:dn,', veces:1 },
  { nombre:'Restaurar sólo el tipo de área seleccionado', viejo:'cambiarCapa:(SIDclave,SIDmostrar)=>Pl(SIDprev=>({...SIDprev,[SIDclave]:SIDmostrar}))', nuevo:'cambiarCapa:(SIDclave,SIDmostrar)=>Pl(SIDprev=>SIDCambiarProducto(SIDprev,SIDclave,SIDmostrar))', veces:1 },
  { nombre:'Filtrar instalaciones con el catálogo vigente', viejo:'{unidades:Ee,ops:Lt,cmoc:Jt},yt,ai)},[vs,zc,Eh,Vd,Lt,Jt,yt,ai])', nuevo:'{unidades:Ee,ops:Lt,cmoc:Jt},yt,ai,h8)},[vs,zc,Eh,Vd,Lt,Jt,yt,ai])', veces:1 },
  ...['zonasLog','sectoresLog','ejesLog','lineasEM','magnitudes'].map(cat=>({
    nombre:`Visibilidad de ${cat} conserva los índices de edición`,
    viejo:cat==='zonasLog'?'(S?.zonasLog===!1?[]:T.zonasLog||[]).forEach((dt,ft)=>{':cat==='magnitudes'?'(Ra?T.magnitudes||[]:[]).forEach((dt,ft)=>{':`(T.${cat}||[]).forEach((dt,ft)=>{`,
    nuevo:(cat==='zonasLog'?'(S?.zonasLog===!1?[]:T.zonasLog||[]).forEach((dt,ft)=>{':cat==='magnitudes'?'(Ra?T.magnitudes||[]:[]).forEach((dt,ft)=>{':`(T.${cat}||[]).forEach((dt,ft)=>{`)+`if(!SIDProductoVisible("${cat}",dt,S,T))return;`, veces:1
  }))
]
