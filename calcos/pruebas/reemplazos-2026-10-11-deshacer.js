// Reemplazos del 2026-10-11 sobre calcos/assets/index-guardado-20261010.js →
// index-deshacer-20261011.js. Lo pidió Sergio (Profesor) con una captura de la barra: «ese botón
// de DESHACER no funciona: sin querer le di en limpiar unidades y ya no pude deshacer esa acción,
// mis unidades se perdieron».
//
// Qué pasaba: el «↶ Deshacer» de la barra guardaba SOLO las fotos del calco (ops: límites, tareas,
// obstáculos…). Las fichas de unidades no entraban nunca en esa pila: «Limpiar» del tablero 🪖
// Unidades las borraba todas de golpe, SIN preguntar, y el botón seguía gris («No hay nada que
// deshacer todavía»). Además la pila no se vaciaba al abrir otro ejercicio ni al cambiar de fase,
// así que un deshacer podía devolver el calco de OTRO ejercicio o de otra fase.
//
// Qué se hace: la misma pila guarda también la foto de las fichas ({__SIDunidades: […]}) antes de
// colocar, mover, borrar, limpiar, insertar (organizaciones tipo, COE, fichas de la IA), repartir
// con el lazo o consolidar agrupaciones; el deshacer devuelve lo que corresponda. «Limpiar» pasa
// a llamarse «🗑 Borrar todas las fichas» y pregunta antes. La pila se vacía al abrir, crear o
// quitar un ejercicio y al cambiar de fase.
module.exports = [
  {
    nombre: 'Deshacer · la pila también guarda las fichas (y se vacía al cambiar de ejercicio o de fase)',
    viejo: 'const Ia=je.useRef([]),[Zr,ip]=je.useState(0),la=je.useCallback(()=>{Ia.current=[...Ia.current.slice(-39),nl.current],ip(Ia.current.length)},[]),',
    nuevo: 'const Ia=je.useRef([]),[Zr,ip]=je.useState(0),la=je.useCallback(()=>{Ia.current=[...Ia.current.slice(-39),nl.current],ip(Ia.current.length)},[]),' +
      'SIDdnRef=je.useRef(dn),SIDdnSync=je.useEffect(()=>{SIDdnRef.current=dn},[dn]),' +
      'SIDlaU=je.useCallback(()=>{Ia.current=[...Ia.current.slice(-39),{__SIDunidades:SIDdnRef.current||[]}],ip(Ia.current.length)},[]),' +
      'SIDpilaNueva=je.useEffect(()=>{Ia.current=[],ip(0)},[wn,yt?.bando,yt?.idx]),',
    veces: 1,
  },
  {
    nombre: 'Deshacer · devuelve las fichas o el calco, según lo último que se guardó',
    viejo: 'Mg=je.useCallback(()=>{const Ee=Ia.current.pop();return ip(Ia.current.length),Ee?(Sn(Ee),!0):!1},[])',
    nuevo: 'Mg=je.useCallback(()=>{const Ee=Ia.current.pop();return ip(Ia.current.length),Ee?Ee.__SIDunidades?(Ra(Ee.__SIDunidades),"unidades"):(Sn(Ee),!0):!1},[])',
    veces: 1,
  },
  {
    nombre: 'Deshacer · el botón de la barra dice qué deshizo',
    viejo: 'onClick:()=>{Mg()?za("↶ Se deshizo el último trazo"):za("No hay nada que deshacer")},title:Zr?`Deshacer el último trazo del calco (quedan ${Zr} pasos guardados)`:"No hay nada que deshacer todavía"',
    nuevo: 'onClick:()=>{const SIDr=Mg();SIDr?za(SIDr==="unidades"?"↶ Se deshizo: las fichas de la carta volvieron como estaban":"↶ Se deshizo el último trazo"):za("No hay nada que deshacer")},title:Zr?`Deshacer el último cambio: un trazo del calco o las fichas (colocar, mover, borrar, insertar) — quedan ${Zr} pasos guardados`:"No hay nada que deshacer todavía"',
    veces: 1,
  },
  {
    nombre: 'Deshacer · colocar, borrar y mover una ficha dejan la foto antes',
    viejo: 'ew=je.useCallback(({lat:Ee,lng:Qe})=>{Ra(ot=>[...ot,{id:Date.now()+Math.random(),lat:Ee,lng:Qe,...ft}])},[ft]),xv=je.useCallback(Ee=>Ra(Qe=>Qe.filter(ot=>ot.id!==Ee)),[]),_v=je.useCallback((Ee,{lat:Qe,lng:ot})=>Ra(ct=>ct.map(xt=>xt.id===Ee?{...xt,lat:Qe,lng:ot}:xt)),[])',
    nuevo: 'ew=je.useCallback(({lat:Ee,lng:Qe})=>{SIDlaU(),Ra(ot=>[...ot,{id:Date.now()+Math.random(),lat:Ee,lng:Qe,...ft}])},[ft]),xv=je.useCallback(Ee=>(SIDlaU(),Ra(Qe=>Qe.filter(ot=>ot.id!==Ee))),[]),_v=je.useCallback((Ee,{lat:Qe,lng:ot})=>(SIDlaU(),Ra(ct=>ct.map(xt=>xt.id===Ee?{...xt,lat:Qe,lng:ot}:xt))),[])',
    veces: 1,
  },
  {
    // Antes: onLimpiar:()=>Ra([]) — todas las fichas afuera, sin preguntar y sin deshacer.
    nombre: 'Unidades · «Borrar todas las fichas» pregunta y se puede deshacer',
    viejo: 'onLimpiar:()=>Ra([])',
    nuevo: 'onLimpiar:()=>{const SIDn=(dn||[]).length;if(!SIDn)return;if(!window.confirm(`¿Borrar las ${SIDn} ficha(s) de la carta?\n\nSi fue sin querer, «↶ Deshacer» de la barra las devuelve.`))return;SIDlaU(),Ra([]),za(`🗑 Se borraron ${SIDn} ficha(s). «↶ Deshacer» de la barra las devuelve.`)}',
    veces: 1,
  },
  {
    nombre: 'Unidades · el botón dice lo que hace',
    viejo: 'f.jsx("button",{style:wr.btnSec,onClick:s,disabled:!(t!=null&&t.length),children:"Limpiar"})',
    nuevo: 'f.jsx("button",{style:wr.btnSec,onClick:s,disabled:!(t!=null&&t.length),title:"Borra TODAS las fichas de la carta (pregunta antes; «↶ Deshacer» de la barra las devuelve)",children:"🗑 Borrar todas las fichas"})',
    veces: 1,
  },
  {
    // Y el mismo puente lleva `agregarDocumentos`: «📎 Adjuntar al ejercicio» del tablero del
    // profesor (calcos/modalidad, la 📜 OGO completa con sus anexos) suma los documentos de la OGO a
    // los documentos del ejercicio (los ven los alumnos), con su categoría («orden», «anexoicia»);
    // un documento con el mismo nombre se reemplaza (volver a adjuntar no lo duplica).
    nombre: 'Deshacer · insertar fichas (organizaciones tipo, COE, IA, Estudio) deja la foto antes; el puente adjunta documentos',
    viejo: 'agregarUnidades:L=>Ra(P=>[...P,...L])',
    nuevo: 'agregarUnidades:L=>(SIDlaU(),Ra(P=>[...P,...L])),agregarDocumentos:L=>hn(P=>[...(P||[]).filter(SIDd=>!L.some(SIDx=>SIDx.nombre===SIDd.nombre)),...L])',
    veces: 1,
  },
  {
    nombre: 'Deshacer · lo que entrega el lazo del Área de Operaciones deja la foto antes',
    viejo: 'duplíquelo para editar.");return}Ra(next)}',
    nuevo: 'duplíquelo para editar.");return}SIDlaU(),Ra(next)}',
    veces: 1,
  },
  {
    nombre: 'Deshacer · consolidar agrupaciones deja la foto antes',
    viejo: 'if(!ot.length)return;Ra(xt=>[...xt,...ot]);',
    nuevo: 'if(!ot.length)return;SIDlaU(),Ra(xt=>[...xt,...ot]);',
    veces: 1,
  },
  {
    // 📜 La OGO completa con sus anexos (calcos/modalidad/ogo.js) se baja en Word con el MISMO
    // formato militar de la Escuela (calcos/formato-militar/v1/word.js, crearWord). word.js recibe
    // las clases de la librería docx del compilado por configurarMilitar; acá esas mismas clases
    // quedan también en window.SIDMilLib para que el tablero del profesor (código aparte del
    // compilado) pueda empaquetar el Word (Packer). No cambia nada de lo que ya exporta la Mesa.
    nombre: 'Word militar · la librería queda a mano para la OGO del profesor',
    viejo: 'SIDMilConfig({Document:A5e,',
    nuevo: 'SIDMilConfig(window.SIDMilLib={Document:A5e,',
    veces: 1,
  },
]
