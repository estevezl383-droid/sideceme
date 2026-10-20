// Reemplazos del 2026-10-20 sobre calcos/assets/index-ht19-fases-20261020.js → index-ains-acostar-20261020.js.
// Lo pidió Sergio con la H.T. 20 hecha por la IA (AIN-2, AIN-3, AIN-5, AIN-1): «le di a la aplicación para
// acostar los AINes y no me los muestra, ¿qué pasa?, ¿dónde están los AINes?».
//
// Qué pasaba: «◎ Acostar las A.I.N.» (wC → $je) sólo deduce el lugar desde el NOMBRE de la A.I.N. y lo busca
// en el terreno clave y los ejes del CMOC. Con «AIN-2» a secas no ubica ninguna y pasa a «ubicar a mano».
//
// Qué se hace (la lógica está en calcos/ains-acostar/v1/ains.mjs): lo que $je deja sin ubicar pasa por
// acostarRestantes, que lo pone en la avenida «AA-n» que nombre la hoja, en los lugares que nombra el indicador
// (o los CAE) buscados en los calcos del terreno (nomenclátor zIe) y el terreno clave, o, si no nombra nada de la
// carta, repartidas sobre las avenidas de aproximación. El aviso dice cuántas hay que revisar.
//
// SHA-256 de index-ht19-fases-20261020.js (antes de estos reemplazos): 79c049e0f7977914456ecfe6a3daf545d89624930c33ca17dc0398836d58b0e6

module.exports = [
  {
    nombre: 'Import del módulo de A.I.N.',
    viejo: 'import {elementosCAE as SIDCaeElem,',
    nuevo: 'import {acostarRestantes as SIDAinsResto,avisoAins as SIDAinsAviso} from "../ains-acostar/v1/ains.mjs?v=ains20261020";import {elementosCAE as SIDCaeElem,',
    veces: 1,
  },
  {
    nombre: 'Acostar A.I.N. (wC): las que $je no ubica van por los lugares de la hoja o sobre las avenidas',
    viejo: 'const{puestas:Qe,sinUbicar:ot}=$je(Ee,{cmoc:Jt,areaOps:Lt.areaOps,ains:Lt.ains||[]});',
    nuevo: 'const SIDAinP=$je(Ee,{cmoc:Jt,areaOps:Lt.areaOps,ains:Lt.ains||[]}),SIDAinR=SIDAinsResto(SIDAinP.sinUbicar,{cmoc:Jt,areaOps:Lt.areaOps,ains:[...Lt.ains||[],...SIDAinP.puestas],lugares:(()=>{try{return zIe(hie({datosCapas:ve,resultados:ne}))}catch{return[]}})()}),Qe=[...SIDAinP.puestas,...SIDAinR.puestas],ot=SIDAinR.sinUbicar;',
    veces: 1,
  },
  {
    nombre: 'Acostar A.I.N. (wC): el aviso dice cuántas quedaron repartidas',
    viejo: 'za(`◎ ${Qe.length} A.I.N. sobre la carta · ${ct} apoyada(s) en terreno clave`+',
    nuevo: 'za(SIDAinsAviso(Qe,ct)+',
    veces: 1,
  },
  {
    nombre: 'Acostar A.I.N. (wC): depende de los calcos del terreno',
    viejo: '},[rw,Jt,Lt.areaOps,Lt.ains,la,ll,Nl,za]),FN=',
    nuevo: '},[rw,Jt,Lt.areaOps,Lt.ains,la,ll,Nl,za,ve,ne]),FN=',
    veces: 1,
  },
]
