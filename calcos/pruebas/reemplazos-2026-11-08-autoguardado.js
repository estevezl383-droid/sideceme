// 2026-11-08 — «No se pudo autoguardar: <!DOCTYPE html>…» (la página de error 520 de Cloudflare
// entera, en rojo, en el panel). El motor (guardado/v1/autoguardado.mjs) ahora la resume en una
// línea y avisa `recuperado` cuando vuelve a guardar bien: acá la Mesa borra el aviso.
module.exports = [
  {
    nombre: 'autoguardado: módulo nuevo (errorLegible + recuperado)',
    veces: 1,
    viejo: 'autoguardado.mjs?v=guardado20261010',
    nuevo: 'autoguardado.mjs?v=guardado20261108',
  },
  {
    nombre: 'autoguardado: aviso corto y se borra al recuperarse',
    veces: 1,
    viejo: 'avisar:ot=>he(ot.vacio?"🛑 "+(ot.error||""):"⚠️ No se pudo autoguardar: "+(ot.error||"")+" — se reintenta solo; tocá el sello 💾 de la barra para reintentar ya, o usá 📁 Ejercicio → Guardar antes de cerrar.")}',
    nuevo: 'avisar:ot=>he(ot.vacio?"🛑 "+(ot.error||""):"No se pudo autoguardar: "+(ot.error||"")+". Se reintenta solo; tu trabajo sigue en pantalla."),recuperado:()=>he(ot=>typeof ot==="string"&&ot.startsWith("No se pudo autoguardar")?"":ot)}',
  },
]
