// Reemplazos del 2026-10-16 sobre calcos/assets/index-abrir-20261012.js → index-tijera-20261016.js.
// Lo pidió Sergio (Profesor) con las capturas de FABBLE 1.1 y de la barra de la Mesa:
//   · «la opción de cortar la quiero en el menú principal (la barra de arriba)»;
//   · «esa herramienta debe ser capaz de cortar el polígono tomando como referencia los límites de
//     las unidades… debe cortar la línea por donde pasa el lazo… no seleccionás las unidades
//     enemigas… debe seleccionar todo lo que esté activado y se vea en la mesa».
//
// La tijera (el lazo, la vista previa, el corte y lo que entrega) está en código legible:
// calcos/areas-operaciones/tijera.mjs, lazo.mjs, recorte.mjs y modelo.mjs. Acá sólo:
//   · los imports con la versión nueva (y la tijera, y cómo recibir los calcos del terreno);
//   · el botón «✂️ Cortar área» en la barra, al lado de «▧ Área de Ops»;
//   · la tijera montada siempre, con lo que se ve en la carta (verCapa, el botón de los
//     clandestinos, los calcos del terreno prendidos y generados) y los candados de siempre;
//   · «Incorporar al ejercicio» suma los calcos del terreno que llegan (los que no tiene) y el Área
//     de Interés (el lazo) si el ejercicio no tiene la suya;
//   · «📂 Abrir archivo JSON» prende los calcos del terreno que traía la selección.
const V = '?v=tijera20261016'
const candado = 'if(ll){Nl();return}if(Bn){he("🔒 Ejercicio finalizado: duplíquelo para editar.");return}'
module.exports = [
  {
    nombre: 'Áreas · imports con la versión nueva, la tijera y cómo recibir el terreno',
    viejo: 'import SIDAreasEditor from "../areas-operaciones/editor.mjs?v=abrir20261012";import {ejercicioDeArchivo as SIDEjercicioDeArchivo,nombreLibre as SIDNombreLibre,encuadrar as SIDEncuadrar,LIMITE_BYTES as SIDLimiteArchivo} from "../areas-operaciones/abrir-archivo.mjs?v=abrir20261012";import {recibirPaquete as SIDRecibirAO,recibirDocumentos as SIDRecibirDocsAO} from "../areas-operaciones/compartir-modelo.mjs?v=seleccion20261011";import {agregarArea as SIDAgregarAO,borrarAreaActiva as SIDBorrarAO,dibujarOtrasAreas as SIDOtrasAO,rotuloArea as SIDRotuloAO} from "../areas-operaciones/modelo.mjs?v=seleccion20261011";',
    nuevo: `import SIDAreasEditor from "../areas-operaciones/editor.mjs${V}";import SIDTijera,{pedirTijera as SIDpedirTijera} from "../areas-operaciones/tijera.mjs${V}";import {ejercicioDeArchivo as SIDEjercicioDeArchivo,nombreLibre as SIDNombreLibre,encuadrar as SIDEncuadrar,LIMITE_BYTES as SIDLimiteArchivo} from "../areas-operaciones/abrir-archivo.mjs${V}";import {recibirPaquete as SIDRecibirAO,recibirDocumentos as SIDRecibirDocsAO,recibirTerreno as SIDRecibirTerrenoAO,recibirAoi as SIDRecibirAoiAO} from "../areas-operaciones/compartir-modelo.mjs${V}";import {agregarArea as SIDAgregarAO,borrarAreaActiva as SIDBorrarAO,dibujarOtrasAreas as SIDOtrasAO,rotuloArea as SIDRotuloAO} from "../areas-operaciones/modelo.mjs${V}";`,
    veces: 1,
  },
  {
    nombre: 'Barra · «✂️ Cortar área» al lado de «▧ Área de Ops»',
    viejo: 'children:"▧ Área de Ops"}),f.jsx("button",{className:"btn-cmoc-abrir",onClick:$c,',
    nuevo: 'children:"▧ Área de Ops"}),nr("medidas")&&f.jsx("button",{className:"btn-cmoc-abrir btn-tijera",onClick:()=>SIDpedirTijera(),title:"✂️ TIJERA: encerrá a mano alzada la zona de un escalón subordinado (un Cuerpo, una División…). Corta el Área de Operaciones por los límites de las unidades, te muestra antes lo que va a cortar (tocá zonas para sumarlas o quitarlas) y guarda la selección con todo lo que se ve en la carta, cortado por donde pasó la tijera: las líneas, las fichas propias y las enemigas que encierres fuera del área, el CMOC y los calcos del terreno prendidos.",children:"✂️ Cortar área"}),f.jsx("button",{className:"btn-cmoc-abrir",onClick:$c,',
    veces: 1,
  },
  {
    nombre: 'Mesa · la tijera montada siempre, con lo que se ve y los candados',
    viejo: 'fs&&nr("medidas")&&f.jsx(_Ce,{',
    nuevo: `nr("medidas")&&f.jsx(SIDTijera,{react:je,ops:Lt,onOps:next=>{${candado}Sn(next)},ejercicio:wn,onDeshacer:()=>{if(!ll&&!Bn)la()},unidades:dn,cmoc:Jt,verCapa:ai,clandestinos:pa,calcosVisibles:fe,resultados:ne,escalon:Ml,herramienta:ba,onHerramienta:Ep,onAbrirAreas:()=>{fs||xi("areaops",!1)}}),fs&&nr("medidas")&&f.jsx(_Ce,{`,
    veces: 1,
  },
  {
    nombre: 'Incorporar al ejercicio · los calcos del terreno y el Área de Interés que llegan',
    viejo: 'hn(prev=>SIDRecibirDocsAO(prev,p));za("Contenido recibido: se conserva el trabajo previo.")',
    nuevo: 'hn(prev=>SIDRecibirDocsAO(prev,p));{const SIDt=SIDRecibirTerrenoAO(ne,p);SIDt!==ne&&Ke(SIDt);const SIDa=SIDRecibirAoiAO(Ae,p);SIDa&&SIDa!==Ae&&(Ie(SIDa),Nn(SIDa.geometry.coordinates[0].slice(0,-1)))}za("Contenido recibido: se conserva el trabajo previo.")',
    veces: 1,
  },
  {
    nombre: '📂 Abrir archivo JSON · prende los calcos del terreno que traía la selección',
    viejo: 'Av(),mm(SIDd,SIDvn,!1),setTimeout(()=>SIDEncuadrar(SIDr.coords),450)',
    nuevo: 'Av(),mm(SIDd,SIDvn,!1),SIDr.calcosVer?.length&&oe(SIDr.calcosVer),setTimeout(()=>SIDEncuadrar(SIDr.coords),450)',
    veces: 1,
  },
]
