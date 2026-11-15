import {abrir} from './alumno.mjs?v=36';
export async function abrirVistaPostulante({invoke,simularId=null}){
 if(!document.getElementById('efmc-style')){const css=document.createElement('link');css.id='efmc-style';css.rel='stylesheet';css.href=new URL('./style.css?v=35',import.meta.url);document.head.append(css);}
 return abrir({onClose:()=>{},invoke:async body=>{
  const accion={mis_evaluaciones:'post_mis_pruebas',confirmar:'post_confirmar',hoja_pdf:'post_hoja_pdf'}[body.accion];
  const data=await invoke({...body,accion,ciclo:'POSTULANTES 2027',...(simularId?{simular_postulante:simularId}:{})});
  if(body.accion!=='mis_evaluaciones')return data;
  return {...data,alumno:data.postulante,permite_descarga:true,solo_lectura:false,organizaciones:data.organizaciones.map(p=>({...p,ciclo:'POSTULANTES 2027'})),servidor_en:new Date().toISOString()};
 }});
}
