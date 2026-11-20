import {zip} from './descargas.mjs?v=41';
import {gradoArma} from './ui.mjs?v=22';
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const notaActual=s=>s.completos===0?null:s.final??Math.round((s.rows.reduce((n,r)=>n+(r.aporte??0),0)+Number.EPSILON)*10000)/10000;
export const atributo=n=>n==null?'':n<51?'D':n<71?'M':n<80?'R':n<85?'B':n<100?'MB':'E';
export function llenarPlantilla(original,list){
 if(!list.length||list.length>150)throw Error('LA PLANTILLA ADMITE ENTRE 1 Y 150 POSTULANTES.');
 const parts={...original},end=9+list.length;
 let sheet=parts['xl/worksheets/sheet1.xml'];
 const cell=(ref,value,formula=null)=>{const re=new RegExp('<c\\b[^>]*\\br="'+ref+'"[^>]*?(?:/>|>[\\s\\S]*?</c>)'),old=sheet.match(re)?.[0];if(!old)throw Error('CELDA NO ENCONTRADA: '+ref);const style=old.match(/\bs="([^"]+)"/)?.[1]||'3';const body=formula?'<f>'+xml(formula)+'</f><v>'+xml(value)+'</v>':value==null?'':typeof value==='number'?'<v>'+value+'</v>':'<is><t xml:space="preserve">'+xml(value)+'</t></is>';sheet=sheet.replace(re,'<c r="'+ref+'" s="'+style+'"'+(typeof value==='string'?' t="'+(formula?'str':'inlineStr')+'"':'')+'>'+body+'</c>');};
 const provisional=list.some(s=>s.final==null);
 cell('A8',provisional?'PROVISIONAL: aporte acumulado. Nota y atributo definitivos al completar las cinco pruebas.':'NOTAS FINALES: cinco pruebas completas.');
 sheet=sheet.replace(/<mergeCells count="(\d+)">/,(_,n)=>'<mergeCells count="'+(Number(n)+1)+'"><mergeCell ref="A8:F8"/>');
 sheet=sheet.replace(/<row r="8"[^>]*>/,'<row r="8" spans="1:6" ht="30" customHeight="1">');
 list.forEach((s,i)=>{const r=i+10,n=notaActual(s);[['A',i+1],['B',String(s.c.ci||'')],['C',gradoArma(s.c)],['D',s.c.nombre_completo],['E',n]].forEach(([c,v])=>cell(c+r,v));const f='IF(ISBLANK(E'+r+'),"",IF(NOT(ISNUMBER(E'+r+')),"REVISAR",IF(OR(E'+r+'<0,E'+r+'>100,ROUND(E'+r+',4)<>E'+r+'),"REVISAR",IF(E'+r+'<51,"D",IF(E'+r+'<71,"M",IF(E'+r+'<80,"R",IF(E'+r+'<85,"B",IF(E'+r+'<100,"MB","E"))))))))';cell('F'+r,atributo(n),f);});
 sheet=sheet.replace(/<row\b[^>]*\br="(\d+)"[^>]*(?:\/>|>[\s\S]*?<\/row>)/g,(row,n)=>Number(n)>end?'':row).replace('ref="A1:F159"','ref="A1:F'+end+'"').replaceAll('A9:F159','A9:F'+end).replaceAll('E10:E159','E10:E'+end);
 parts['xl/worksheets/sheet1.xml']=sheet;
 delete parts['xl/calcChain.xml'];
 parts['xl/_rels/workbook.xml.rels']=parts['xl/_rels/workbook.xml.rels'].replace(/<Relationship\b[^>]*Type="[^"]*\/calcChain"[^>]*\/>/g,'');
 parts['[Content_Types].xml']=parts['[Content_Types].xml'].replace(/<Override\b[^>]*PartName="\/xl\/calcChain.xml"[^>]*\/>/g,'');
 parts['xl/workbook.xml']=parts['xl/workbook.xml'].replaceAll('$F$159','$F$'+end).replace(/<calcPr\b[^>]*\/>/,'<calcPr fullCalcOnLoad="1" forceFullCalc="1"/>');
 return zip(parts,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
export async function descargarPlantilla({list,authorized=()=>true}){
 const snapshot=structuredClone(list),r=await fetch(new URL('./plantilla-notas.json?v=41',import.meta.url));
 if(!r.ok)throw Error('NO SE PUDO CARGAR LA PLANTILLA DE NOTAS.');
 const blob=llenarPlantilla(await r.json(),snapshot);
 if(!authorized())throw Error('SESIÓN FINALIZADA.');
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NOTAS_EFM_'+snapshot[0].fecha+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
