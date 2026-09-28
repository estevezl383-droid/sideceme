// Reemplazos hechos el 2026-09-28 (segundo paso del día) sobre el compilado de
// la Mesa del EM (calcos/assets/index-zhbwncsH.js → el que carga hoy
// calcos/index.html). Los pidió Sergio: plan de fuegos en la pestaña «🔥 Fuegos».
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.
//
// El plan de fuegos vive en archivos legibles aparte (calcos/fuegos/). Acá sólo:
//   · se guarda con el ejercicio (`planFuegos`), como `academico`;
//   · con la pestaña «🔥 Fuegos» abierta la carta entra en «modo fuegos», que es
//     el mismo `dibujando` que ya usan las herramientas de trazado: ninguna capa
//     (Área de Operaciones, CMOC, límites, plantilla…) toma el clic ni muestra
//     sus puntos blancos para arrastrar;
//   · la pestaña monta el panel del módulo en lugar de «¿Qué blancos alcanzo
//     hoy?» (que contaba sólo fichas sueltas: las piezas de artillería metidas
//     en una FT no aparecían y daba «0 piezas de apoyo»);
//   · la Mesa le presta su Leaflet y sus cálculos (window.__mesaFuegos);
//   · la hoja «Matriz de ejecución de apoyo de fuegos» se llena con las
//     concentraciones del plan cuando las hay.
module.exports = [
  {
    nombre: 'Fuegos · estado del plan y del «modo fuegos»',
    viejo: '[uc,jl]=je.useState([]),[acadMesa,setAcadMesa]=je.useState(null)',
    nuevo: '[uc,jl]=je.useState([]),[acadMesa,setAcadMesa]=je.useState(null),[planFuegos,setPlanFuegos]=je.useState(null),[modoFuegos,setModoFuegos]=je.useState(!1)',
    veces: 1,
  },
  {
    nombre: 'Fuegos · se guarda con el ejercicio (lo que se arma para guardar)',
    viejo: 'orgTarea:uc,academico:acadMesa,anillosUnidades:al,',
    nuevo: 'orgTarea:uc,academico:acadMesa,planFuegos,anillosUnidades:al,',
    veces: 1,
  },
  {
    nombre: 'Fuegos · el autoguardado se entera de los cambios',
    viejo: '[X,Z,Ae,cn,ne,dn,Lt,Jt,$i,Ya,Kr,uc,acadMesa,al,Yn,',
    nuevo: '[X,Z,Ae,cn,ne,dn,Lt,Jt,$i,Ya,Kr,uc,acadMesa,planFuegos,al,Yn,',
    veces: 1,
  },
  {
    nombre: 'Fuegos · el archivo del ejercicio lleva «planFuegos»',
    viejo: 'orgTarea:t.orgTarea||[],academico:t.academico||null,',
    nuevo: 'orgTarea:t.orgTarea||[],academico:t.academico||null,planFuegos:t.planFuegos||null,',
    veces: 1,
  },
  {
    nombre: 'Fuegos · al abrir un ejercicio se recupera su plan',
    viejo: 'jl(Ee.orgTarea||[]),setAcadMesa(Ee.academico||null),',
    nuevo: 'jl(Ee.orgTarea||[]),setAcadMesa(Ee.academico||null),setPlanFuegos(Ee.planFuegos||null),',
    veces: 1,
  },
  {
    nombre: 'Fuegos · un ejercicio con concentraciones no cuenta como vacío',
    viejo: 'e(t.orgTarea)===0&&!(t.academico&&e(t.academico.actividades)>0)&&',
    nuevo: 'e(t.orgTarea)===0&&!(t.academico&&e(t.academico.actividades)>0)&&!(t.planFuegos&&e(t.planFuegos.blancos)>0)&&',
    veces: 1,
  },
  {
    nombre: 'Fuegos · con la pestaña abierta, la carta está en «modo fuegos» (ninguna capa toma el clic)',
    viejo: 'gp=di||Kt||!!ba||Mn&&!!hi,',
    nuevo: 'gp=di||Kt||!!ba||Mn&&!!hi||modoFuegos,',
    veces: 1,
  },
  {
    nombre: 'Fuegos · la Mesa le pasa los datos al módulo',
    viejo: '},[dn,uc,acadMesa,wn,Pc,Ha]);',
    nuevo:
      '},[dn,uc,acadMesa,wn,Pc,Ha]);je.useEffect(()=>{const M=window.MesaFuegos;M&&M.sincronizar({unidades:Vd,todas:dn,orgTarea:uc,plan:planFuegos,' +
      'setPlan:setPlanFuegos,modo:modoFuegos,setModo:setModoFuegos,ejercicio:wn,unidad:Tn?.unidad||"",irA:Fn})},[Vd,dn,uc,planFuegos,modoFuegos,wn,Tn,Fn]);',
    veces: 1,
  },
  {
    nombre: 'Fuegos · la Mesa le presta su Leaflet, el catálogo de armas y sus cálculos',
    viejo: 'window.__mesaSimbolos={sb,eN,cb,VK,pLe,fl,T1,Nm,zg,lP,tN,js};',
    nuevo: 'window.__mesaSimbolos={sb,eN,cb,VK,pLe,fl,T1,Nm,zg,lP,tN,js};window.__mesaFuegos={Rt,p5,dK,mK,eh,lP,dP,uP,js,Xc,cota:w9.cota};',
    veces: 1,
  },
  {
    nombre: 'Fuegos · la pestaña monta el panel del módulo (función estable para el ref)',
    viejo: 'function ILe({propias:t,enemigas:e}){',
    nuevo: 'function pfMontar(el){const M=window.MesaFuegos;M&&M.montar(el)}function ILe({propias:t,enemigas:e}){',
    veces: 1,
  },
  {
    nombre: 'Fuegos · el panel del plan reemplaza «¿Qué blancos alcanzo hoy?» (apertura)',
    viejo: 'return f.jsxs(f.Fragment,{children:[f.jsx("div",{style:At.rotulo,children:"¿Qué blancos alcanzo hoy?"}),',
    nuevo:
      'return f.jsxs(f.Fragment,{children:[window.MesaFuegos?f.jsx("div",{className:"pf-montaje",ref:pfMontar}):f.jsxs(f.Fragment,{children:[' +
      'f.jsx("div",{style:At.rotulo,children:"¿Qué blancos alcanzo hoy?"}),',
    veces: 1,
  },
  {
    nombre: 'Fuegos · el panel del plan reemplaza «¿Qué blancos alcanzo hoy?» (cierre)',
    viejo: 's.eno.id))]}),f.jsx("div",{style:At.rotulo,children:"Alcance de las armas de apoyo para el planeamiento"})',
    nuevo: 's.eno.id))]})]}),f.jsx("div",{style:At.rotulo,children:"Alcance de las armas de apoyo para el planeamiento"})',
    veces: 1,
  },
  {
    nombre: 'Fuegos · la Matriz de ejecución de apoyo de fuegos se llena con las concentraciones del plan',
    viejo: 'case"fuegos":{const Ne=Ae.filter(Dm);',
    nuevo: 'case"fuegos":{const pfF=window.MesaFuegos&&window.MesaFuegos.filasMatriz();if(pfF&&pfF.length)return pfF;const Ne=Ae.filter(Dm);',
    veces: 1,
  },
]
