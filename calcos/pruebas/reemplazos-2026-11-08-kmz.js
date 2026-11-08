// 🌍 Abrir KMZ / KML de Google Earth en 📁 Ejercicios (calcos/areas-operaciones/abrir-kmz.mjs).
// Sobre index-ogo-20261030.js → index-kmz-20261108.js (construir-kmz.js). Cada «viejo» aparece exactamente
// `veces` veces; deshaciendo en orden inverso se vuelve byte por byte (reemplazos-compilado.js).
module.exports = [
  {
    nombre: 'El lector de KMZ/KML, al lado del de JSON',
    viejo: 'LIMITE_BYTES as SIDLimiteArchivo} from "../areas-operaciones/abrir-archivo.mjs?v=tijera20261016";',
    nuevo: 'LIMITE_BYTES as SIDLimiteArchivo} from "../areas-operaciones/abrir-archivo.mjs?v=tijera20261016";import {leerArchivoMesa as SIDLeerArchivoMesa,unirArchivos as SIDUnirArchivos} from "../areas-operaciones/abrir-kmz.mjs?v=kmz20261108";',
    veces: 1,
  },
  {
    nombre: 'El archivo se lee con el lector nuevo (JSON tal cual; KMZ/KML → paquete de áreas y fichas)',
    viejo: 'let SIDj;try{SIDj=JSON.parse(await SIDf.text())}catch{return{ok:!1,error:`«${SIDf.name}» no es un JSON válido.`}}',
    nuevo: 'let SIDj;try{SIDj=await SIDLeerArchivoMesa(SIDf)}catch(SIDe){return{ok:!1,error:String(SIDe?.message||SIDe)}}',
    veces: 1,
  },
  {
    nombre: 'Varios archivos a la vez se abren como un solo ejercicio',
    viejo: 'const SIDf=se.target.files?.[0];se.target.value="";',
    nuevo: 'const SIDf=SIDUnirArchivos(se.target.files);se.target.value="";',
    veces: 1,
  },
  {
    nombre: 'El botón acepta KMZ y KML',
    viejo: 'title:"La selección guardada (Seleccion_….json), las áreas (AO_….json) o un ejercicio (EJERCICIO_….json): se abre como ejercicio nuevo y la carta va a su área",onClick:()=>SIDarch.current?.click(),children:SIDocupado?"⏳ Abriendo el archivo…":"📂 Abrir archivo JSON (selección, áreas o ejercicio)"}),f.jsx("input",{ref:SIDarch,type:"file",accept:".json,application/json","aria-label":"Archivo JSON para abrir",',
    nuevo: 'title:"La selección guardada (Seleccion_….json), las áreas (AO_….json), un ejercicio (EJERCICIO_….json) o KMZ/KML de Google Earth con áreas de operaciones y fichas (se pueden elegir varios): se abre como ejercicio nuevo y la carta va a su área",onClick:()=>SIDarch.current?.click(),children:SIDocupado?"⏳ Abriendo el archivo…":"📂 Abrir archivo JSON o KMZ (selección, áreas, fichas o ejercicio)"}),f.jsx("input",{ref:SIDarch,type:"file",accept:".json,application/json,.kmz,.kml,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml",multiple:!0,"aria-label":"Archivo JSON, KMZ o KML para abrir",',
    veces: 1,
  },
  {
    nombre: 'La nota dice qué se toma del KMZ',
    viejo: 'children:"El JSON que bajó la Mesa se abre acá, no con doble clic (la computadora lo manda a otro programa). Se abre como ejercicio NUEVO y la carta va a su área: el que tenés abierto no se toca."',
    nuevo: 'children:"El JSON que bajó la Mesa se abre acá, no con doble clic (la computadora lo manda a otro programa). Se abre como ejercicio NUEVO y la carta va a su área: el que tenés abierto no se toca. Del KMZ/KML de Google Earth se toman las Áreas de Operaciones (AO, subteatros) y las fichas de unidades (rojas si la carpeta dice enemigo/rojo); se pueden elegir varios KMZ juntos. Los calcos del terreno se vuelven a generar acá."',
    veces: 1,
  },
]
