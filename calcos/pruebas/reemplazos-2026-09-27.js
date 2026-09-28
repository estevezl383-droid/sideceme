// Reemplazos hechos el 2026-09-27 sobre el compilado de la Mesa del EM
// (calcos/assets/index-4OsERrlJ.js → el que carga hoy calcos/index.html).
//
// Es la lista EXACTA: cada «viejo» se buscó en el compilado anterior (tenía que
// aparecer «veces» veces) y se cambió por «nuevo». reemplazos-compilado.js
// comprueba que deshaciéndolos se vuelve byte por byte al anterior.
// Si se vuelve a compilar desde el fuente, esto es lo que hay que pasarle.

// Parches del 3D (espejo MapLibre → Leaflet) sobre el compilado de la Mesa del EM.
// Cada uno: texto EXACTO que se busca, cuántas veces tiene que aparecer y el reemplazo.
const TRES_D = [
  {
    nombre: '3D · doble toque = doble clic (terminar líneas y áreas con el dedo)',
    viejo:
      'u=M=>{if(Date.now()-this.recienArrastre<350)return;const T=this.datos(Rt.latLng(M.lngLat.lat,M.lngLat.lng),M.originalEvent);n.fire("preclick",T),!i()&&this.disparar(this.destino(M,"click"),"click",M)},' +
      'h=M=>{n.doubleClickZoom.enabled()||i()||(M.originalEvent&&M.originalEvent.preventDefault(),this.disparar(this.destino(M,"dblclick"),"dblclick",M))};',
    nuevo:
      // ¿El clic vino de un dedo? pointerType lo dice en Chrome; Safari no lo trae
      // en el click, así que también vale «hubo un toque hace menos de 1 s».
      'tac=O=>!!O&&(O.pointerType==="touch"||O.pointerType==="pen"||!O.pointerType&&performance.now()-(this.ultToque||-1e9)<1e3),' +
      'u=M=>{if(Date.now()-this.recienArrastre<350)return;const O=M.originalEvent,esT=tac(O);' +
      'if(esT&&this.presionHecha){this.presionHecha=!1;return}' +
      'const T=this.datos(Rt.latLng(M.lngLat.lat,M.lngLat.lng),O);if(n.fire("preclick",T),i())return;' +
      'this.disparar(this.destino(M,"click"),"click",M);if(!esT)return;' +
      // Dos toques en menos de 400 ms y a menos de 30 px: doble clic, como el
      // «dblclick» que Leaflet simula para el dedo en el 2D.
      'const t0=O&&O.timeStamp||performance.now(),q=this.toque;' +
      'if(q&&t0-q.t>=0&&t0-q.t<=400&&Math.hypot(M.point.x-q.x,M.point.y-q.y)<=30){this.toque=null;' +
      'n.doubleClickZoom.enabled()||(this.dobleTactil=t0,this.disparar(this.destino(M,"dblclick"),"dblclick",M))}' +
      'else this.toque={t:t0,x:M.point.x,y:M.point.y}},' +
      // Si el navegador además manda su propio dblclick de ese doble toque, no se repite.
      'h=M=>{const O=M.originalEvent;n.doubleClickZoom.enabled()||i()||(O&&O.preventDefault(),' +
      'this.dobleTactil!=null&&O&&O.timeStamp>=this.dobleTactil&&O.timeStamp-this.dobleTactil<1500||' +
      'this.disparar(this.destino(M,"dblclick"),"dblclick",M))};',
    veces: 1,
  },
  {
    nombre: '3D · dedo: sincroniza el zoom por doble toque y el toque largo = clic derecho',
    viejo: 'a.addEventListener("contextmenu",E);const S=Ai.sub(',
    nuevo:
      'a.addEventListener("contextmenu",E);' +
      // Al apoyar el dedo: MapLibre no hace zoom con el doble toque si Leaflet no
      // lo hace (dibujando), y se arma el toque largo (600 ms quieto = menú contextual).
      'const tS=ev=>{this.ultToque=performance.now(),o(),this.presionHecha=!1,clearTimeout(this.presionTm),this.presion=null;' +
      'const t=ev.touches;if(!t||t.length!==1||i())return;const p=t[0];this.presion={x:p.clientX,y:p.clientY,el:ev.target};' +
      'this.presionTm=setTimeout(()=>{const P=this.presion;if(this.presion=null,!P)return;' +
      'const R=e.getCanvas().getBoundingClientRect(),pt={x:P.x-R.left,y:P.y-R.top};let ll=null;try{ll=e.unproject([pt.x,pt.y])}catch{}' +
      'if(!ll)return;const F={point:pt,lngLat:ll,originalEvent:{type:"contextmenu",target:P.el,clientX:P.x,clientY:P.y,button:2,timeStamp:performance.now(),preventDefault(){},stopPropagation(){}}};' +
      'this.presionHecha=!0,this.disparar(this.destino(F,"contextmenu"),"contextmenu",F)},600)},' +
      'tM=ev=>{const P=this.presion;if(!P)return;const t=ev.touches;(!t||t.length!==1||Math.hypot(t[0].clientX-P.x,t[0].clientY-P.y)>15)&&(clearTimeout(this.presionTm),this.presion=null)},' +
      'tE=()=>{this.ultToque=performance.now(),clearTimeout(this.presionTm),this.presion=null},opT={capture:!0,passive:!0};' +
      'a.addEventListener("touchstart",tS,opT),a.addEventListener("touchmove",tM,opT),a.addEventListener("touchend",tE,opT),a.addEventListener("touchcancel",tE,opT);' +
      'const S=Ai.sub(',
    veces: 1,
  },
  {
    nombre: '3D · al cerrar la vista se sueltan también los escuchas del dedo',
    viejo: 'a.removeEventListener("contextmenu",E),S(),cancelAnimationFrame(g)}',
    nuevo:
      'a.removeEventListener("contextmenu",E),a.removeEventListener("touchstart",tS,opT),a.removeEventListener("touchmove",tM,opT),' +
      'a.removeEventListener("touchend",tE,opT),a.removeEventListener("touchcancel",tE,opT),clearTimeout(this.presionTm),S(),cancelAnimationFrame(g)}',
    veces: 1,
  },
  {
    nombre: '3D · distancias en píxeles medidas en la vista que se está mirando',
    viejo: 'function Ave({',
    nuevo:
      // En 3D la carta Leaflet queda escondida y su proyección no es la de la
      // pantalla: «tocar cerca del primer vértice» se medía en otra escala.
      'function pxVista(m,ll){const g=typeof window<"u"&&window.__map3d;if(g&&ll)try{const p=g.project([ll.lng,ll.lat]);return Rt.point(p.x,p.y)}catch{}return m.latLngToContainerPoint(ll)}' +
      'function Ave({',
    veces: 1,
  },
  {
    nombre: '3D · cerrar el Área de Operaciones tocando el primer vértice',
    viejo: 'const pa=_e.latLngToContainerPoint(bn),Gn=_e.latLngToContainerPoint(Rt.latLng(Pn[0][1],Pn[0][0]));',
    nuevo: 'const pa=pxVista(_e,bn),Gn=pxVista(_e,Rt.latLng(Pn[0][1],Pn[0][0]));',
    veces: 1,
  },
  {
    nombre: '3D · manija de giro de tareas y magnitudes (cercanía en la vista)',
    viejo: 'const ft=_e.latLngToContainerPoint(dt.latlng);',
    nuevo: 'const ft=pxVista(_e,dt.latlng);',
    veces: 1,
  },
  {
    nombre: '3D · manija de giro (las dos distancias)',
    viejo: 'ft.distanceTo(_e.latLngToContainerPoint(Zt.latlng))',
    nuevo: 'ft.distanceTo(pxVista(_e,Zt.latlng))',
    veces: 2,
  },
]

// La plantilla situacional enemiga (arcos de apoyo, bandas, líneas, fichas) era la
// ÚNICA capa de la carta que seguía tomando el clic mientras se traza: el clic
// abría el cartel del arco y el vértice no se ponía. Pasaba en 2D y en 3D, y el
// arco cubre justo el terreno donde va el plan de barreras. Ahora, como el resto
// de las capas (CMOC, medidas, terreno), deja pasar el clic mientras se dibuja.
const PLANTILLA = [
  {
    nombre: 'Plantilla · recibe «dibujando»',
    viejo: 'function lve({plantilla:t,ver:e=!0,sinFichas:n=!1,partes:a=null}){',
    nuevo: 'function lve({plantilla:t,ver:e=!0,sinFichas:n=!1,partes:a=null,dibujando:dj=!1}){',
    veces: 1,
  },
  { nombre: 'Plantilla · arcos de apoyo', viejo: 'fillOpacity:I.principal?.16:.12,interactive:!0}', nuevo: 'fillOpacity:I.principal?.16:.12,interactive:!dj}', veces: 1 },
  { nombre: 'Plantilla · L.P.R.', viejo: 'Rt.polyline(S(I.coords),{color:v,weight:5,opacity:.95})', nuevo: 'Rt.polyline(S(I.coords),{color:v,weight:5,opacity:.95,interactive:!dj})', veces: 1 },
  {
    nombre: 'Plantilla · líneas de despliegue',
    viejo: 'Rt.polyline(S(I.coords),{color:E,weight:1.4,dashArray:"4 5",opacity:.85})',
    nuevo: 'Rt.polyline(S(I.coords),{color:E,weight:1.4,dashArray:"4 5",opacity:.85,interactive:!dj})',
    veces: 1,
  },
  { nombre: 'Plantilla · ejes', viejo: 'opacity:I.doctrinal?.75:.9})', nuevo: 'opacity:I.doctrinal?.75:.9,interactive:!dj})', veces: 1 },
  { nombre: 'Plantilla · zonas', viejo: 'fillColor:g,fillOpacity:.04,interactive:!0}', nuevo: 'fillColor:g,fillOpacity:.04,interactive:!dj}', veces: 1 },
  { nombre: 'Plantilla · bandas', viejo: 'fillColor:g,fillOpacity:.06,interactive:!0}', nuevo: 'fillColor:g,fillOpacity:.06,interactive:!dj}', veces: 1 },
  {
    nombre: 'Plantilla · fichas enemigas de la plantilla',
    viejo: 'interactive:!0,zIndexOffset:I.rol==="artilleria"?640:620}',
    nuevo: 'interactive:!dj,zIndexOffset:I.rol==="artilleria"?640:620}',
    veces: 1,
  },
  {
    nombre: 'Plantilla · se redibuja al empezar y terminar de trazar',
    viejo: '}catch{}return()=>{i.removeLayer(y)}},[i,t,e,n,o]),null}',
    nuevo: '}catch{}return()=>{i.removeLayer(y)}},[i,t,e,n,o,dj]),null}',
    veces: 1,
  },
  {
    nombre: 'Plantilla · la carta le pasa si se está trazando',
    viejo: 'f.jsx(lve,{plantilla:jt,ver:oe?oe.plantilla!==!1:!0,sinFichas:t,partes:oe})',
    nuevo: 'f.jsx(lve,{plantilla:jt,ver:oe?oe.plantilla!==!1:!0,sinFichas:t,partes:oe,dibujando:tn})',
    veces: 1,
  },
]

// Conexión mínima de la Mesa con el módulo «🎓 Estudio» (calcos/academico/).
// El módulo vive en archivos legibles aparte; acá sólo se le pasan los datos,
// se guarda lo suyo con el ejercicio y se agrega el botón.
const ESTUDIO = [
  {
    nombre: 'Estudio · estado «academico» del ejercicio (actividades)',
    viejo: '[uc,jl]=je.useState([])',
    nuevo: '[uc,jl]=je.useState([]),[acadMesa,setAcadMesa]=je.useState(null)',
    veces: 1,
  },
  {
    nombre: 'Estudio · se guarda con el ejercicio (lo que se arma para guardar)',
    viejo: 'orgTarea:uc,anillosUnidades:al,',
    nuevo: 'orgTarea:uc,academico:acadMesa,anillosUnidades:al,',
    veces: 1,
  },
  {
    nombre: 'Estudio · el autoguardado se entera de los cambios',
    viejo: '[X,Z,Ae,cn,ne,dn,Lt,Jt,$i,Ya,Kr,uc,al,Yn,',
    nuevo: '[X,Z,Ae,cn,ne,dn,Lt,Jt,$i,Ya,Kr,uc,acadMesa,al,Yn,',
    veces: 1,
  },
  {
    nombre: 'Estudio · el archivo del ejercicio lleva «academico»',
    viejo: 'orgTarea:t.orgTarea||[],',
    nuevo: 'orgTarea:t.orgTarea||[],academico:t.academico||null,',
    veces: 1,
  },
  {
    nombre: 'Estudio · al abrir un ejercicio se recuperan sus actividades',
    viejo: 'jl(Ee.orgTarea||[]),',
    nuevo: 'jl(Ee.orgTarea||[]),setAcadMesa(Ee.academico||null),',
    veces: 1,
  },
  {
    nombre: 'Estudio · un ejercicio con actividades no cuenta como vacío',
    viejo: 'e(t.orgTarea)===0&&',
    nuevo: 'e(t.orgTarea)===0&&!(t.academico&&e(t.academico.actividades)>0)&&',
    veces: 1,
  },
  {
    nombre: 'Estudio · la Mesa le pasa los datos al módulo',
    viejo: '},[wn,Bn,Ud]);',
    nuevo:
      '},[wn,Bn,Ud]);je.useEffect(()=>{const M=window.MesaAcademica;M&&M.sincronizar({unidades:dn,orgTarea:uc,academico:acadMesa,ejercicio:wn,' +
      'docente:!!Pc&&(!window.SIDECEME_CALCOS||!!window.SIDECEME_CALCOS.esProfesor),puesto:Ha||null,centro:()=>Da.current,setOrgTarea:jl,setAcademico:setAcadMesa,agregarUnidades:L=>Ra(P=>[...P,...L])})},[dn,uc,acadMesa,wn,Pc,Ha]);',
    veces: 1,
  },
  {
    nombre: 'Estudio · botón «🎓 Estudio» en la barra',
    viejo: 'children:["🎖️ ",Ha?`Mesa · ${Ha.toUpperCase()}`:"Mesa EM"]}),',
    nuevo:
      'children:["🎖️ ",Ha?`Mesa · ${Ha.toUpperCase()}`:"Mesa EM"]}),' +
      'f.jsx("button",{className:"btn-cmoc-abrir",onClick:()=>window.MesaAcademica?window.MesaAcademica.abrir():window.alert("No se cargó el módulo de estudio (calcos/academico/academico.js)."),' +
      'title:"Estudio doctrinario (material didáctico): organización académica —fuerzas de tarea y unidades puras— y simbología con su referencia",children:"🎓 Estudio"}),',
    veces: 1,
  },
  {
    nombre: 'Estudio · la Mesa le presta sus dibujos de símbolos',
    viejo: 't6.createRoot(document.getElementById("root"))',
    nuevo: 'window.__mesaSimbolos={sb,eN,cb,VK,pLe,fl,T1,Nm,zg,lP,tN,js};t6.createRoot(document.getElementById("root"))',
    veces: 1,
  },
  {
    nombre: 'Organización de la tarea · una pieza no entra en dos agrupaciones',
    viejo: 'I=K=>{if(!E){window.alert("Primero elegí una agrupación de la derecha (o creá una con «＋ Nueva agrupación»).");return}S(E.id,{piezas:[...E.piezas||[],K]})}',
    nuevo:
      'I=K=>{if(!E){window.alert("Primero elegí una agrupación de la derecha (o creá una con «＋ Nueva agrupación»).");return}' +
      'const yaEn=e.find(ag=>(ag.piezas||[]).some(p=>p&&p.id===K.id));if(yaEn){window.alert(`«${K.nom}» ya está en «${yaEn.nombre||"otra agrupación"}»: un elemento pertenece a una sola organización.`);return}' +
      'S(E.id,{piezas:[...E.piezas||[],K]})}',
    veces: 1,
  },
  {
    nombre: 'Organización de la tarea · la unidad pura se ve con su marca',
    viejo: 't.ft&&f.jsx("span",{style:La.chipFT,title:"Organizada como Fuerza de Tarea",children:"FT"})',
    nuevo:
      't.ft&&f.jsx("span",{style:La.chipFT,title:"Organizada como Fuerza de Tarea",children:"FT"}),' +
      '!t.ft&&t.clase==="pura"&&f.jsx("span",{style:{...La.chipFT,background:"rgba(92,225,255,0.18)",color:"#5ce1ff",border:"1px solid #5ce1ff"},title:"Unidad pura (🎓 Estudio · Organización académica)",children:"PURA"})',
    veces: 1,
  },
  {
    nombre: 'Organización de la tarea · no hace falta repartir todas las piezas',
    viejo: '" ya en el calco · quedan ",f.jsx("b",{children:v.length})," piezas sin repartir"',
    nuevo: '" ya en el calco · ",f.jsx("b",{children:v.length})," pieza(s) siguen con su unidad orgánica (no es obligatorio repartirlas)"',
    veces: 1,
  },
  {
    nombre: 'Organización de la tarea · una pieza repetida no achica dos veces a su unidad',
    viejo: 'const Ee={};for(const ot of uc||[])if(ot.consolidada&&dP(ot,dn))for(const ct of ot.piezas||[])Ee[ct.de]=(Ee[ct.de]||0)+1;',
    nuevo:
      'const Ee={},vistas=new Set;for(const ot of uc||[])if(ot.consolidada&&dP(ot,dn))for(const ct of ot.piezas||[])ct&&!vistas.has(ct.id)&&(vistas.add(ct.id),Ee[ct.de]=(Ee[ct.de]||0)+1);',
    veces: 1,
  },
]

module.exports = [...TRES_D, ...PLANTILLA, ...ESTUDIO]
