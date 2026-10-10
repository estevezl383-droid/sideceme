// Reemplazos del 2026-10-10 sobre calcos/assets/index-lazo-20261010.js →
// index-guardado-20261010.js. Lo pidió Sergio (Profesor) con una captura del sello
// «💾 guardado 10:34 a. m.»: «parece que no funciona, no autoguarda» y «que se le dé click y
// se quede guardado ese rato todos los cambios». El autoguardado pasa a un módulo legible,
// calcos/guardado/v1/autoguardado.mjs (ver calcos/guardado/README.md): acá el compilado sólo lo
// importa, le pasa cómo se arma y cómo se guarda el ejercicio, y el sello pasa a ser un botón.
const V = '?v=guardado20261010'
module.exports = [
  {
    nombre: 'Autoguardado · importa el módulo legible',
    viejo: 'import {dibujarApoyo as SIDApoyo,anchoNumero as SIDAnchoNumero} from "../unidades/simbolos-apoyo.mjs";',
    nuevo: `import {usarAutoguardado as SIDusarAutoguardado,sello as SIDselloGuardado} from "../guardado/v1/autoguardado.mjs${V}";\nimport {dibujarApoyo as SIDApoyo,anchoNumero as SIDAnchoNumero} from "../unidades/simbolos-apoyo.mjs";`,
    veces: 1,
  },
  {
    // Antes: un temporizador de 2,5 s que se reiniciaba con cada cambio; si fallaba, el sello
    // seguía con la hora vieja. Ahora: el mismo guardado (misma foto, mismo og.guardar, mismo
    // candado de «vacío», mismo `ys` que la Mesa vacía al abrir o crear un ejercicio) con
    // espera máxima, red de seguridad, guardado al salir, reintentos y estado para el sello.
    nombre: 'Autoguardado · el temporizador pasa al módulo (usarAutoguardado)',
    viejo:
      'je.useEffect(()=>{if(!(!wn||Bn))return clearTimeout(Jr.current),Jr.current=setTimeout(async()=>{const Ee=Ud(wn);Ee.finalizado=!1;const Qe=JSON.stringify({...Ee,guardadoEn:""});if(Qe===ys.current)return;ul(!0);const ot=await og.guardar(wn,Ee);ul(!1),ot?.ok===!1?he(ot.vacio?"🛑 "+(ot.error||""):"⚠️ No se pudo autoguardar: "+(ot.error||"")+" — usá 📁 Ejercicio → Guardar antes de cerrar."):(ys.current=Qe,qo(new Date().toLocaleTimeString("es-BO",{hour:"2-digit",minute:"2-digit"})))},2500),()=>clearTimeout(Jr.current)},[wn,Bn,Ud]);',
    nuevo:
      'const SIDag=SIDusarAutoguardado(je,{activo:!!wn&&!Bn,cambio:Ud,nombre:wn,ultimo:ys,foto:()=>{const Ee=Ud(wn);Ee.finalizado=!1;return Ee},guardar:Ee=>og.guardar(wn,Ee),avisar:ot=>he(ot.vacio?"🛑 "+(ot.error||""):"⚠️ No se pudo autoguardar: "+(ot.error||"")+" — se reintenta solo; tocá el sello 💾 de la barra para reintentar ya, o usá 📁 Ejercicio → Guardar antes de cerrar.")});',
    veces: 1,
  },
  {
    nombre: 'Autoguardado · el sello es un botón: tocarlo guarda todo en ese momento',
    viejo:
      'f.jsx("span",{className:"sello-guardado",title:Bn?"Ejercicio finalizado: no se autoguarda.":"Se guarda solo 2,5 s después de cada cambio — incluidas las hojas de trabajo.",children:Bn?"🔒 finalizado":is?"💾 guardando…":ir?`💾 guardado ${ir}`:"💾 autoguardado activo"})',
    nuevo: 'f.jsx("span",{className:"sid-sello-caja",children:f.jsx("button",{type:"button",className:"sello-guardado",...SIDselloGuardado(SIDag,Bn)})})',
    veces: 1,
  },
]
