// Reemplazos del 2026-10-10 sobre calcos/assets/index-pedido-20261010.js →
// index-lazo-20261010.js. Lo pidió Sergio (Profesor): repartir el Área de Operaciones de la
// FF.TT.T.O. en Cuerpos sin redibujarla y entregarle a cada escalón subordinado SU área con
// todo lo que está dentro (límites, puntos, marcas, fichas…). El lazo y el recorte están en
// calcos/areas-operaciones (recorte.mjs, lazo.mjs); acá sólo se le pasan al panel las fichas,
// la magnitud elegida y la herramienta activa, y se fuerza la versión nueva de los módulos.
const V = '?v=lazo20261010'
module.exports = [
  {
    nombre: 'Áreas · editor con versión (no mezclar con un módulo viejo en caché)',
    viejo: 'import SIDAreasEditor from "../areas-operaciones/editor.mjs";',
    nuevo: `import SIDAreasEditor from "../areas-operaciones/editor.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Áreas · compartir-modelo con versión',
    viejo: 'from "../areas-operaciones/compartir-modelo.mjs";',
    nuevo: `from "../areas-operaciones/compartir-modelo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Áreas · modelo con versión',
    viejo: 'from "../areas-operaciones/modelo.mjs";',
    nuevo: `from "../areas-operaciones/modelo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Panel del Área de Operaciones · recibe las fichas',
    viejo: 'function _Ce({SIDops,SIDonOps,SIDejercicio,SIDdeshacer,SIDnube,',
    nuevo: 'function _Ce({SIDops,SIDonOps,SIDejercicio,SIDdeshacer,SIDnube,SIDunidades,SIDonUnidades,',
    veces: 1,
  },
  {
    nombre: 'Panel del Área de Operaciones · le pasa al editor fichas, magnitud y herramienta',
    viejo: 'f.jsx(SIDAreasEditor,{react:je,ops:SIDops,onOps:SIDonOps,ejercicio:SIDejercicio,onDeshacer:SIDdeshacer,nube:SIDnube})',
    nuevo: 'f.jsx(SIDAreasEditor,{react:je,ops:SIDops,onOps:SIDonOps,ejercicio:SIDejercicio,onDeshacer:SIDdeshacer,nube:SIDnube,unidades:SIDunidades,onUnidades:SIDonUnidades,escalon:y,herramienta:u,onHerramienta:h})',
    veces: 1,
  },
  {
    nombre: 'Mesa · fichas al panel (con los mismos candados que ops)',
    viejo: 'SIDejercicio:wn,SIDnube:{activo:g2==="servidor"',
    nuevo: 'SIDejercicio:wn,SIDunidades:dn,SIDonUnidades:next=>{if(ll){Nl();return}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}Ra(next)},SIDnube:{activo:g2==="servidor"',
    veces: 1,
  },
]
