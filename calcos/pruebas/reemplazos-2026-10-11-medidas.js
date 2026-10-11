// Reemplazos del 2026-10-11 sobre calcos/assets/index-deshacer-20261011.js →
// index-medidas-20261011.js. Lo pidió Sergio (Profesor) después de la revisión de coherencia de la
// OGO: «las medidas de coordinación que trae la IA (líneas de fase, áreas de empeñamiento) aparecen
// listadas, pero se dibujan a mano… ARREGLA ESTO».
//
// Qué pasaba: el tablero del profesor (calcos/modalidad, código aparte del compilado) sólo podía
// COLOCAR FICHAS por el puente de MesaAcademica.sincronizar (agregarUnidades): las medidas de
// coordinación y control que trae la IA en los DATOS de la revisión de coherencia (LF ALFA, AE-1,
// OBJ 1, PC 2…) quedaban en una lista para trazarlas a mano. Y un límite o un punto de
// coordinación de la Mesa no muestra nombre: aunque se trazara «LF ALFA», en la carta no se leía.
//
// Qué se hace:
//   · el puente lleva `agregarOps(capas)`: suma al calco (ops) lo que llega en las capas limites,
//     coordinacion, objetivos, pasaje y magnitudes, con la foto del ↶ Deshacer antes, y respeta los
//     candados de siempre (BASE de otro puesto: Nl(); ejercicio finalizado: el aviso de siempre);
//     devuelve true si lo sumó. El efecto se vuelve a sincronizar si cambian esos candados.
//   · la carta 2D rotula un límite o una línea que traiga `nombre` (en la mitad del trazo, o en el
//     centro si es un contorno cerrado) y un punto de coordinación que traiga `nombre`; el texto va
//     escapado (lo escribe la IA). Lo que ya estaba dibujado (sin nombre) se ve igual que antes.
module.exports = [
  {
    nombre: 'Puente · agregarOps: las medidas de la IA entran al calco (con ↶ Deshacer y los candados)',
    viejo: 'agregarDocumentos:L=>hn(P=>[...(P||[]).filter(SIDd=>!L.some(SIDx=>SIDx.nombre===SIDd.nombre)),...L])})},[dn,uc,acadMesa,wn,Pc,Ha])',
    nuevo: 'agregarDocumentos:L=>hn(P=>[...(P||[]).filter(SIDd=>!L.some(SIDx=>SIDx.nombre===SIDd.nombre)),...L]),' +
      'agregarOps:L=>{if(ll){Nl();return!1}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return!1}' +
      'const SIDk=["limites","coordinacion","objetivos","pasaje","magnitudes"].filter(SIDc=>Array.isArray(L?.[SIDc])&&L[SIDc].length);if(!SIDk.length)return!1;' +
      'la();Sn(P=>{const SIDn={...P};for(const SIDc of SIDk)SIDn[SIDc]=[...(P[SIDc]||[]),...L[SIDc]];return SIDn});return!0}' +
      '})},[dn,uc,acadMesa,wn,Pc,Ha,ll,Bn])',
    veces: 1,
  },
  {
    nombre: 'Carta 2D · un límite o una línea con nombre lo muestra',
    viejo: 'if((Ra?T.limites||[]:[]).forEach((dt,ft)=>{const mt=dt.tipo==="punteada",Kt=Yn(dt.coords,{weight:4.5,dashArray:mt?"10 7":null,interactive:SIDed});',
    nuevo: 'if((Ra?T.limites||[]:[]).forEach((dt,ft)=>{const mt=dt.tipo==="punteada",Kt=Yn(dt.coords,{weight:4.5,dashArray:mt?"10 7":null,interactive:SIDed});' +
      'if(dt.nombre&&dt.coords?.length>1){const SIDc=dt.coords,SIDu=SIDc[SIDc.length-1],SIDce=SIDc.length>3&&SIDu[0]===SIDc[0][0]&&SIDu[1]===SIDc[0][1],' +
      'SIDp=SIDce?[SIDc.reduce((s,q)=>s+q[1],0)/SIDc.length,SIDc.reduce((s,q)=>s+q[0],0)/SIDc.length]:[(SIDc[Math.floor((SIDc.length-1)/2)][1]+SIDc[Math.ceil((SIDc.length-1)/2)][1])/2,(SIDc[Math.floor((SIDc.length-1)/2)][0]+SIDc[Math.ceil((SIDc.length-1)/2)][0])/2];' +
      'Rt.marker(SIDp,{interactive:!1,icon:Rt.divIcon({className:"",html:`<div style="color:#111;font:800 ${Math.max(11,15*oe).toFixed(1)}px/1 Arial;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;white-space:nowrap;text-align:center">${String(dt.nombre).replace(/[&<>"]/g,SIDx=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"})[SIDx])}</div>`,iconSize:[160,22],iconAnchor:[80,SIDce?11:26]})}).addTo(_n)}',
    veces: 1,
  },
  {
    nombre: 'Carta 2D · un punto de coordinación con nombre lo muestra',
    viejo: '(Ra?T.coordinacion||[]:[]).forEach((dt,ft)=>{const mt=Rt.marker([dt.centro[1],dt.centro[0]],{icon:Sve(),interactive:dn,zIndexOffset:600}).addTo(_n);',
    nuevo: '(Ra?T.coordinacion||[]:[]).forEach((dt,ft)=>{const mt=Rt.marker([dt.centro[1],dt.centro[0]],{icon:Sve(),interactive:dn,zIndexOffset:600}).addTo(_n);' +
      'dt.nombre&&Rt.marker([dt.centro[1],dt.centro[0]],{interactive:!1,icon:Rt.divIcon({className:"",html:`<div style="color:#111;font:800 ${Math.max(10,13*oe).toFixed(1)}px/1 Arial;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;white-space:nowrap">${String(dt.nombre).replace(/[&<>"]/g,SIDx=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"})[SIDx])}</div>`,iconSize:[140,18],iconAnchor:[-12,9]})}).addTo(_n);',
    veces: 1,
  },
]
