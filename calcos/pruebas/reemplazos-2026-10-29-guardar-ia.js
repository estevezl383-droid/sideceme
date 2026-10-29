// Cambios sobre el compilado congelado de áreas logísticas. No se toca el estado guardado.
module.exports = [
  {
    "nombre": "Importar límites de espera y copia alternativa",
    "viejo": "import {ProductosEM as SIDProductosEM,productoVisible as SIDProductoVisible,cambiarProducto as SIDCambiarProducto,sectoresRepresentados as SIDSectoresRepresentados} from \"../visibilidad/v1/productos-em.mjs?v=20261029-areas-logisticas\";",
    "nuevo": "import {conLimite as SIDPedidoConLimite,leerJSON as SIDPedidoJSON,copiarTexto as SIDCopiarPedido} from \"../pedido/v1/fiabilidad.mjs?v=20261029-guardar-ia\";\nimport {ProductosEM as SIDProductosEM,productoVisible as SIDProductoVisible,cambiarProducto as SIDCambiarProducto,sectoresRepresentados as SIDSectoresRepresentados} from \"../visibilidad/v1/productos-em.mjs?v=20261029-areas-logisticas\";",
    "veces": 1
  },
  {
    "nombre": "Actualizar el motor de los pedidos",
    "viejo": "from \"../estado-mayor/v7/registro.js\"",
    "nuevo": "from \"../estado-mayor/v7/registro.js?v=20261029-guardar-ia\"",
    "veces": 1
  },
  {
    "nombre": "Limitar la espera de capas de archivos",
    "viejo": "async function N6e(t,e){const n=await fetch(Sye(e,t));if(!n.ok)throw new Error(`No se pudo cargar la capa ${t}`);return await n.json()}",
    "nuevo": "async function N6e(t,e){return SIDPedidoJSON(Sye(e,t))}",
    "veces": 1
  },
  {
    "nombre": "Limitar la espera de capas del servidor, incluido el cuerpo JSON",
    "viejo": "const i=await fetch(`${a.url}/functions/v1/calcos-datos`,{method:\"POST\",headers:{\"Content-Type\":\"application/json\",...a.anonKey?{apikey:a.anonKey,Authorization:`Bearer ${a.anonKey}`}:{}},body:JSON.stringify({accion:\"recortar\",token:a.token,pais:e,capas:t,aoi:n})});let o;try{o=await i.json()}catch{throw new Error(`El servidor respondió mal (${i.status})`)}",
    "nuevo": "const o=await SIDPedidoJSON(`${a.url}/functions/v1/calcos-datos`,{method:\"POST\",headers:{\"Content-Type\":\"application/json\",...a.anonKey?{apikey:a.anonKey,Authorization:`Bearer ${a.anonKey}`}:{}},body:JSON.stringify({accion:\"recortar\",token:a.token,pais:e,capas:t,aoi:n})});",
    "veces": 1
  },
  {
    "nombre": "No esperar indefinidamente el censo opcional",
    "viejo": "const e=await fetch(t);if(!e.ok)return null;const n=await e.json(),a=new Map",
    "nuevo": "const n=await SIDPedidoJSON(t,{}, {ms:10000}),a=new Map",
    "veces": 1
  },
  {
    "nombre": "Liberar la caja de IA si la preparación no termina",
    "viejo": "const _e=await SIDMEDespues(a(y,H),SIDdesp);",
    "nuevo": "const _e=await SIDMEDespues(SIDPedidoConLimite(()=>a(y,H)),SIDdesp);",
    "veces": 1
  },
  {
    "nombre": "Limitar también la preparación para descargar el pedido",
    "viejo": "const pe=await SIDMEDespues(a(y,H),SIDdesp);",
    "nuevo": "const pe=await SIDMEDespues(SIDPedidoConLimite(()=>a(y,H)),SIDdesp);",
    "veces": 1
  },
  {
    "nombre": "Copiar con una alternativa al portapapeles nativo",
    "viejo": "await navigator.clipboard.writeText(Re)",
    "nuevo": "await SIDCopiarPedido(Re)",
    "veces": 1
  },
  {
    "nombre": "Informar errores al descargar el pedido",
    "viejo": "«Cumplí el pedido del archivo: contestá SÓLO con el bloque JSON».\"})}finally{T(!1)}},se=",
    "nuevo": "«Cumplí el pedido del archivo: contestá SÓLO con el bloque JSON».\"})}catch(SIDe){S({tipo:\"err\",txt:SIDe?.message||String(SIDe)})}finally{T(!1)}},se=",
    "veces": 1
  },
  {
    "nombre": "Dejar tiempo al navegador para iniciar la descarga",
    "viejo": "_e.click(),document.body.removeChild(_e),URL.revokeObjectURL(ve),j(!0)",
    "nuevo": "_e.click(),document.body.removeChild(_e),setTimeout(()=>URL.revokeObjectURL(ve),4000),j(!0)",
    "veces": 1
  },
  {
    "nombre": "Copiar un pedido ya listo sin repetir la carga del terreno",
    "viejo": "B&&f.jsx(\"button\",{style:Ir.btnSec,onClick:()=>te(pe=>!pe),children:G?\"▾ Ocultar\":\"👁 Ver el pedido\"})",
    "nuevo": "B&&f.jsx(\"button\",{style:Ir.btnSec,onClick:()=>te(pe=>!pe),children:G?\"▾ Ocultar\":\"👁 Ver el pedido\"}),B&&f.jsx(\"button\",{style:Ir.btnSec,disabled:M,title:\"Copia el texto ya preparado. Si cambiaste la hoja o su indicación, prepara un pedido nuevo.\",onClick:()=>{te(!0);SIDCopiarPedido(B).then(()=>S({tipo:\"ok\",txt:\"Texto preparado copiado. Pegalo en tu IA.\"}),SIDe=>S({tipo:\"err\",txt:SIDe.message}))},children:\"📋 Copiar texto preparado\"})",
    "veces": 1
  },
  {
    "nombre": "Explicar cómo recuperar un texto preparado si el portapapeles falla",
    "viejo": "El portapapeles está bloqueado en este navegador. Usá «Descargar el pedido» y adjuntá el archivo a la IA.",
    "nuevo": "El pedido está listo, pero el navegador bloqueó la copia. Usá «Copiar texto preparado», seleccioná el texto para copiarlo manualmente o descargá el pedido.",
    "veces": 1
  }
]
