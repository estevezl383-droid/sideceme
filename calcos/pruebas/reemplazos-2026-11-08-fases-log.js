// Reemplazos del 2026-11-08 sobre calcos/assets/index-matriz-decision-20261108.js → index-fases-log-20261108.js.
//
// 🚚 Sergio, con el ARCE propuesto en la FASE 1 del CAP 1 y la FASE 2 sin nada: «el ASDI que se elige se elige para
// todas las fases del ejercicio, igual las instalaciones están ahí en todas las fases… los ejes de abastecimiento y de
// evacuación los armaré en una determinada fase: si lo armo en la fase 3 se queda en la fase 4 y 5… si llego a la fase
// 5 debo poder modificarlo… si no lo modifiqué se queda lo de la fase 3… lo mismo aplica al G-1 con su línea de
// extraviados y lo que le competa».
//
// Cada fase guarda una copia entera del calco y de las fichas; al tocar otra fase (`Uo`) la Mesa ponía la copia de
// esa fase. Ahora `fo` (guardar la fase activa) y `Uo` (tocar una fase) pasan por logistica/v1/fases-log.mjs:
//   · las áreas logísticas (ASDI, ARCE, las propuestas), sus sectores, flechas y marcos, el planLog y las fichas del
//     área (el Batallón Logístico desplegado y las instalaciones dentro del área) van a TODAS las fases;
//   · los EPA/EPE, las líneas del EM (Línea de Extraviados, PP.GG., eje humanitario) y las instalaciones de afuera,
//     desde la fase en que se arman hacia adelante, sin pisar la fase que tiene su propio cambio.
// `Uo` carga la fase de lo que devuelve `fo` (antes leía `Yn`, las fases de ANTES de guardar).
//
// Va también el reemplazo de reemplazos-2026-11-08-puente-concepto.js (el import de concepto-operacion/v1/carta.js sin
// `?v=`, para que la F3·P4 y los CAP compartan el puente): esa entrega estaba armada sobre index-decision-cap y,
// subida después de la matriz de decisión, la habría borrado. Es el mismo cambio, ahora sobre el compilado vigente.
//
// SHA-256 de index-matriz-decision-20261108.js (antes de estos reemplazos): ver construir-fases-log.js.
module.exports = [
  {
    nombre: 'El puente de la F3·P4 en UN solo módulo: carta.js sin ?v=, como lo piden el editor y el panel de los CAP',
    viejo: 'import {sincronizarCarta as SIDCOSync} from "../concepto-operacion/v1/carta.js?v=20261029-cursos";',
    nuevo: 'import {sincronizarCarta as SIDCOSync} from "../concepto-operacion/v1/carta.js";',
    veces: 1,
  },
  {
    nombre: 'El import de fases-log.mjs (lo del G-4 y del G-1 a lo largo de las fases)',
    // Después del import de decision.mjs (el que puso la matriz de decisión): no cae dentro de lo que insertaron las
    // listas anteriores (guia-inicial.mjs lo revisa).
    viejo: 'pedidoDecision as SIDDecPedido,trasDecision as SIDDecTras} from "../evento-critico/v1/decision.mjs?v=matriz20261108";',
    nuevo:
      'pedidoDecision as SIDDecPedido,trasDecision as SIDDecTras} from "../evento-critico/v1/decision.mjs?v=matriz20261108";import {alGuardar as SIDLogGuardar,alCargar as SIDLogCargar} from "../logistica/v1/fases-log.mjs?v=20261108-fases-log";',
    veces: 1,
  },
  {
    nombre: 'fo: al guardar la fase activa, lo de todo el ejercicio a todas las fases y lo que se hereda a las que siguen',
    viejo:
      'fo=je.useCallback(Ee=>yt?{...Ee,[yt.bando]:Ee[yt.bando].map((Qe,ot)=>ot===yt.idx?{...Qe,unidades:dn.filter(ct=>ct.deFaseEnemiga==null),ops:Qr(Lt),desplazamientos:Jt.desplazamientos,...(yt.bando==="propio"?{plan:planFuegos}:{})}:Qe)}:Ee,[yt,dn,Lt,Jt.desplazamientos,Qr,planFuegos])',
    nuevo:
      'fo=je.useCallback(Ee=>SIDLogGuardar(Ee,yt?{...Ee,[yt.bando]:Ee[yt.bando].map((Qe,ot)=>ot===yt.idx?{...Qe,unidades:dn.filter(ct=>ct.deFaseEnemiga==null),ops:Qr(Lt),desplazamientos:Jt.desplazamientos,...(yt.bando==="propio"?{plan:planFuegos}:{})}:Qe)}:Ee,{activa:yt,unidades:dn,ops:Lt}),[yt,dn,Lt,Jt.desplazamientos,Qr,planFuegos])',
    veces: 1,
  },
  {
    nombre: 'Uo: la fase que se toca sale de lo ya guardado (no de las fases de antes de guardar), puesta al día',
    viejo: 'kn(vn=>fo(vn));const xt=(ot=Yn[Ee])==null?void 0:ot[Qe];',
    nuevo:
      'kn(vn=>SIDLogCargar(fo(vn),vn,{activa:yt,unidades:dn,ops:Lt}));const xt=(ot=SIDLogCargar(fo(Yn),Yn,{activa:yt,unidades:dn,ops:Lt})[Ee])==null?void 0:ot[Qe];',
    veces: 1,
  },
  {
    nombre: 'Uo depende también de la fase activa y del calco a la vista',
    viejo: '},[fo,Yn,Qr,dn]);Mc.current=Uo;',
    nuevo: '},[fo,Yn,Qr,dn,yt,Lt]);Mc.current=Uo;',
    veces: 1,
  },
]
