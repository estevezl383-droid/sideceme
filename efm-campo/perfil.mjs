import {edad} from './baremos.mjs';
export function fechaEditable(iso){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||'');return m?`${m[3]}/${m[2]}/${m[1]}`:'';}
export function leerFechaEditable(text){const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(text||'').trim());return m?`${m[3]}-${m[2]}-${m[1]}`:null;}
export function validarNacimiento(iso,dia){const a=edad(iso,dia);return a===null||a<20||a>100?'REVISÁ LA FECHA COMPLETA (DD/MM/AAAA). EL AÑO DEBE TENER CUATRO DÍGITOS Y CORRESPONDER A UN ADULTO.':'';}
export function fechaPerfil(c,records=[]){return c?.fecha_nacimiento||records.find(r=>r.cursante_id===c?.id&&r.nacimiento)?.nacimiento||'';}
