import {PRUEBAS,datosHoja,valoresHoja,marca,evaluador,novedadesHoja} from './informes.mjs?v=11';
import {edad} from './baremos.mjs';
import {gradoArma} from './ui.mjs?v=10';
const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const membrete=['FACULTAD DE CIENCIAS Y ARTES MILITARES TERRESTRES','ESCUELA DE COMANDO Y ESTADO MAYOR DEL EJÉRCITO','“MCAL. ANDRÉS DE SANTA CRUZ”','BOLIVIA'];
const roles=['EVALUADOR TALLA-PESO','EVALUADOR NATACIÓN','EVALUADOR ABDOMINALES','EVALUADOR FLEXIONES EN SUELO','EVALUADOR AERÓBICA 3.200 M'];
const n=v=>v??'PENDIENTE';
const headers=['N.º','GRADO','APELLIDOS Y NOMBRES','EDAD','TALLA (M)','PESO (KG)','NOTA T/P','29 %','NAT. (M)','NOTA NAT.','11 %','ABD. CANT.','NOTA ABD.','20 %','FLEX. CANT.','NOTA FLEX.','20 %','AER. TIEMPO','NOTA AER.','20 %','FINAL 100 %'];
export function matriz(s,i){const v=valoresHoja(s);return [i+1,gradoArma(s.c),s.c.nombre_completo,edad(s.nacimiento,s.fecha)??'PENDIENTE',v[1],v[0],...v.slice(2)];}
export function zip(parts,mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
 const enc=new TextEncoder(),chunks=[],central=[];let offset=0;const le=(n,b)=>Array.from({length:b},(_,i)=>(n>>>(i*8))&255);
 const crc=d=>{let c=-1;for(const b of d){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^-1)>>>0;};
 for(const [name,value] of Object.entries(parts)){const nb=enc.encode(name),data=typeof value==='string'?enc.encode(value):value,check=crc(data);const h=new Uint8Array([...le(0x04034b50,4),...le(20,2),...le(0x800,2),...le(0,2),...le(0,2),...le(0,2),...le(check,4),...le(data.length,4),...le(data.length,4),...le(nb.length,2),...le(0,2)]);chunks.push(h,nb,data);central.push(new Uint8Array([...le(0x02014b50,4),...le(20,2),...le(20,2),...le(0x800,2),...le(0,2),...le(0,2),...le(0,2),...le(check,4),...le(data.length,4),...le(data.length,4),...le(nb.length,2),...le(0,2),...le(0,2),...le(0,2),...le(0,2),...le(0,4),...le(offset,4)]),nb);offset+=h.length+nb.length+data.length;}
 const length=central.reduce((a,b)=>a+b.length,0);return new Blob([...chunks,...central,new Uint8Array([...le(0x06054b50,4),...le(0,2),...le(0,2),...le(Object.keys(parts).length,2),...le(Object.keys(parts).length,2),...le(length,4),...le(offset,4),...le(0,2)])],{type:mime});
}
function save(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
async function portrait(c){if(!c.foto)return null;try{const response=await fetch(c.foto);if(!response.ok)return null;const blob=await response.blob();const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext('2d').drawImage(bitmap,0,0);bitmap.close();return canvas.toDataURL('image/jpeg',.85);}catch{return null;}}
const unbase=s=>Uint8Array.from(atob(s.split(',').at(-1)),c=>c.charCodeAt(0));
function p(s,size=18,bold=false){return `<w:p><w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="${size}"/>${bold?'<w:b/>':''}</w:rPr><w:t xml:space="preserve">${xml(s)}</w:t></w:r></w:p>`;}
function table(rows,widths){return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(x=>`<w:${x} w:val="single" w:sz="4" w:color="000000"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map((r,i)=>`<w:tr><w:trPr><w:cantSplit/>${i===0?'<w:tblHeader/>':''}</w:trPr>${r.map((v,j)=>`<w:tc><w:tcPr><w:tcW w:w="${widths[j]}" w:type="dxa"/></w:tcPr>${p(v,14,i===0)}</w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;}
function firmaWord(config){return p('')+table(roles.map((r,i)=>[config[Object.keys(PRUEBAS)[i]]||'',r]).reduce((a,r,i)=>{a[0][i]=r[0]+'\n________________________';a[1][i]=r[1];return a;},[[],[]]),Array(5).fill(2900))+p('________________________     JEFE DE CURSO: '+(config.jefe_curso||''))+p('________________________     JEFE DE ENTRENAMIENTO FÍSICO: '+(config.jefe_efm||''))+p('________________________     JEFE DE LA SAC.: '+(config.jefe_sac||''))+p('________________________     JEFE DE ESTUDIOS: '+(config.jefe_estudios||''))+p('________________________     COMANDANTE DE LA ECEME.: '+(config.comandante||''));}
async function word(list,config,scope){
 const response=await fetch(new URL('./modelo-hoja.json?v=10',import.meta.url));if(!response.ok)throw Error('NO SE PUDO CARGAR EL MODELO WORD.');const parts=await response.json();const original=parts['word/document.xml'];let body='',pictures=[];
 if(scope==='curso'){
  const widths=[360,850,2700,400,...Array(17).fill(590)];
  body=membrete.map(x=>p(x,18,true)).join('')+p('MATRIZ DE LA EVALUACIÓN FÍSICA MILITAR · '+list[0].c.ciclo,22,true)+p(`FECHA: ${list[0].fecha} · CURSO: ${config.cursoLabel||'TODOS'} · ${list.filter(s=>s.final!=null).length}/${list.length} COMPLETOS · REGISTROS DE PRUEBA`)+table([headers,...list.map(matriz)],widths)+firmaWord(config);
 }else{
  for(let i=0;i<list.length;i++){const s=list[i],values=datosHoja(s,config);if(s.final==null)values.v16='S/R';let filled=original.replace(/\{\{(\w+)\}\}/g,(_,k)=>xml(values[k]??''));if(novedadesHoja(s)){filled=filled.replace(/<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g,cell=>cell.includes('<w:t>OBSERVACIONES</w:t>')?cell.replace(/<w:t>[.…]+<\/w:t>/, '<w:t>'+xml(novedadesHoja(s))+'</w:t>'):cell);}let b=filled.match(/<w:body>([\s\S]*?)<w:sectPr/)[1];const pic=await portrait(s.c);
   if(pic){const rid='efmPhoto'+i;pictures.push({rid,name:`foto${i}.jpeg`,bytes:unbase(pic)});b=b.replace(/r:embed="rId\d+"/g,`r:embed="${rid}"`).replace(/wp:docPr id="\d+"/g,`wp:docPr id="${i+1}"`);}else{b=b.replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g,'');}
   body+=(i?'<w:p><w:r><w:br w:type="page"/></w:r></w:p>':'')+b;
  }
 }
 const prefix=original.slice(0,original.indexOf('<w:body>')+8),section=original.slice(original.indexOf('<w:sectPr'));
 let drawingId=0;body=body.replace(/wp:docPr id="\d+"/g,()=>`wp:docPr id="${++drawingId}"`);
 parts['word/document.xml']=prefix+body+section;
 parts['word/_rels/document.xml.rels']=parts['word/_rels/document.xml.rels'].replace(/<Relationship[^>]+Type="[^"]*\/image"[^>]*\/>/g,'').replace('</Relationships>',pictures.map(p=>`<Relationship Id="${p.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${p.name}"/>`).join('')+'</Relationships>');
 for(const p of pictures)parts['word/media/'+p.name]=p.bytes;
 return zip(parts);
}
function signatures(config){return Object.keys(PRUEBAS).map((p,i)=>[config[p]||'',roles[i]]).concat(['jefe_curso','jefe_efm','jefe_sac','jefe_estudios','comandante'].map((p,i)=>[config[p]||'',['JEFE DE CURSO','JEFE DE ENTRENAMIENTO FÍSICO','JEFE DE LA SAC.','JEFE DE ESTUDIOS','COMANDANTE DE LA ECEME.'][i]]));}
async function excel(list,config,scope){
 if(typeof globalThis.ensureXLSX!=='function')throw Error('GENERADOR EXCEL NO DISPONIBLE.');await globalThis.ensureXLSX();const X=globalThis.XLSX,wb=X.utils.book_new();
 const groups=scope==='hojas'?list.map(s=>[s]):[list];
 groups.forEach((group,idx)=>{
  const rows=[...membrete.map(x=>[x]),[],['MATRIZ DE LA EVALUACIÓN FÍSICA MILITAR'],[`FECHA: ${group[0].fecha} · ${group[0].c.ciclo} · CURSO: ${config.cursoLabel||group[0].c.paralelo||'TODOS'} · REGISTROS DE PRUEBA`],[],headers,...group.map(matriz),[],...signatures(group.length===1?{...config,...Object.fromEntries(Object.keys(PRUEBAS).map(p=>[p,evaluador(group[0],p)]))}:config).map(([name,role])=>['________________________',name,role])];
  if(group.length===1){const s=group[0],d=datosHoja(s,config);rows.push([],['FECHA DE NACIMIENTO',d.nacimiento,'CI',d.ci,'SEXO',d.sexo],['FIRMA DEL EVALUADO','________________________','HUELLA DIGITAL','________________________'],['VALORACIÓN MÉDICA','APTO / NO APTO'],['PRESIÓN ARTERIAL',''],['SATURACIÓN',''],['PULSO',''],['SELLO Y FIRMA ENFERMERA (O)','________________________'],['SELLO Y FIRMA MÉDICO S.O.','________________________'],['GRUPO',s.organizacion?.grupo||''],['OBSERVACIONES',novedadesHoja(s)]);}
  const ws=X.utils.aoa_to_sheet(rows);ws['!cols']=headers.map((_,i)=>({wch:i===2?38:i===1?13:i===3?8:11}));ws['!merges']=[0,1,2,3,5,6].map(r=>({s:{r,c:0},e:{r,c:20}}));ws['!rows']=rows.map((r,i)=>({hpt:i===8?40:24}));ws['!autofilter']={ref:`A9:U${9+group.length}`};
  for(const k of Object.keys(ws)){if(k[0]==='!')continue;const cell=ws[k],pos=X.utils.decode_cell(k);cell.s={font:{name:'Arial',sz:10,bold:pos.r<9},alignment:{vertical:'center',wrapText:true},border:{bottom:{style:'thin',color:{rgb:'BBBBBB'}}}};if(pos.r===8)cell.s.fill={fgColor:{rgb:'D9E9E5'}};if(cell.t==='n')cell.z='0.00';}
  X.utils.book_append_sheet(wb,ws,scope==='hojas'?`${idx+1} ${group[0].c.id}`.slice(0,31).replace(/[\\/?*\[\]:]/g,'_'):'EVALUACIÓN');
 });
 return new Blob([X.write(wb,{bookType:'xlsx',type:'array'})],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function cell(doc,text,x,y,w,h,size=7,bold=false){doc.setDrawColor(50);doc.rect(x,y,w,h);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(String(text??''),w-5);doc.text(lines,x+2.5,y+size+3);}
function signaturePDF(doc,config,y){const all=signatures(config);all.forEach(([name,role],i)=>{const col=i%5,row=Math.floor(i/5),x=20+col*150;doc.setFontSize(7);doc.setFont('helvetica','normal');doc.text('____________________________',x,y+row*43);doc.text(doc.splitTextToSize(name,144),x,y+10+row*43);doc.setFont('helvetica','bold');doc.text(doc.splitTextToSize(role,144),x,y+22+row*43);});}
async function pdf(list,config,scope){
 if(typeof globalThis._rgJsPDF!=='function')throw Error('GENERADOR PDF NO DISPONIBLE.');const PDF=await globalThis._rgJsPDF(),doc=new PDF({orientation:'landscape',unit:'pt',format:'letter'});let page=0;
 const top=(title,date)=>{if(page++)doc.addPage();doc.setFont('helvetica','bold');doc.setFontSize(9);membrete.forEach((x,i)=>doc.text(x,20,24+i*12));doc.setFontSize(11);doc.text(title,20,87);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(date+' · REGISTROS DE PRUEBA',20,104);};
 if(scope==='curso'){
  const widths=[24,50,150,28,...Array(17).fill(29.4)];
  for(let start=0;start<list.length;start+=14){top('MATRIZ DE LA EVALUACIÓN FÍSICA MILITAR · '+list[0].c.ciclo,`FECHA: ${list[0].fecha} · CURSO: ${config.cursoLabel||'TODOS'} · ${list.filter(s=>s.final!=null).length}/${list.length} COMPLETOS`);let x=20;headers.forEach((h,j)=>{cell(doc,h,x,116,widths[j],44,6,true);x+=widths[j];});list.slice(start,start+14).forEach((s,i)=>{let x=20;matriz(s,start+i).forEach((v,j)=>{cell(doc,v,x,160+i*22,widths[j],22,6);x+=widths[j];});});signaturePDF(doc,config,500);}
 }else{
  for(const s of list){const d=datosHoja(s,config);top('HOJA DE EVALUACIÓN DEL EXAMEN FÍSICO MILITAR DE LA ECEME.',`FECHA: ${s.fecha} · ${s.completos}/5 NOTAS CARGADAS`);const image=await portrait(s.c);if(image)doc.addImage(image,'JPEG',720,18,50,60);
   cell(doc,`GRADO, APELLIDOS Y NOMBRES: ${d.nombre}     CICLO: ${d.ciclo}     CURSO: ${d.curso}`,20,118,752,28,8,true);
   cell(doc,`NACIMIENTO: ${d.nacimiento}      EDAD: ${d.edad} AÑOS      CI: ${d.ci}      SEXO: ${d.sexo}`,20,146,752,25,8);
   const groups=[['PESO – TALLA',4],['NATACIÓN',3],['ABDOMINALES',3],['FLEXIONES EN SUELO',3],['AERÓBICA 3.200 METROS',3],['NOTA FINAL',1],['FIRMA DEL EVALUADO',1],['HUELLA DIGITAL',1]],widths=[...Array(17).fill(35),78,79];let x=20,idx=0;
   groups.forEach(([name,count])=>{const w=widths.slice(idx,idx+count).reduce((a,b)=>a+b,0);cell(doc,name,x,171,w,38,7,true);x+=w;idx+=count;});
   const sub=['PESO KG','TALLA M','NOTA','29 %','DIST. M','NOTA','11 %','CANT.','NOTA','20 %','CANT.','NOTA','20 %','TIEMPO','NOTA','20 %','100 %','',''];x=20;sub.forEach((v,i)=>{cell(doc,v,x,209,widths[i],30,6,true);x+=widths[i];});x=20;[...valoresHoja(s),'',''].forEach((v,i)=>{cell(doc,v,x,239,widths[i],36,6);x+=widths[i];});
   cell(doc,'PRESIÓN ARTERIAL: __________________\n\nSATURACIÓN: _______________________\n\nPULSO: _____________________________',20,275,200,125,8);
   cell(doc,'VALORACIÓN MÉDICA DE APTITUD FÍSICA\n\nAPTO [  ]     NO APTO [  ]\n\nFECHA: ______________________',220,275,265,125,9,true);
   cell(doc,'OBSERVACIONES\n\n'+(novedadesHoja(s)||'________________________________________'),485,275,287,125,8);
   cell(doc,'SELLO Y FIRMA ENFERMERA (O)\n\n____________________________',20,400,200,64,8);cell(doc,'SELLO Y FIRMA MÉDICO S.O.\n\n____________________________',220,400,265,64,8);cell(doc,'',485,400,287,64,8);signaturePDF(doc,{...config,...Object.fromEntries(Object.keys(PRUEBAS).map(p=>[p,evaluador(s,p)]))},500);
  }
 }
 const count=doc.getNumberOfPages();for(let i=1;i<=count;i++){doc.setPage(i);doc.setFontSize(7);doc.setFont('helvetica','normal');doc.text(`${i} / ${count}`,748,602);}
 return doc.output('blob');
}
export async function descargar({formato,scope,list,config,authorized=()=>true}){
 if(!list.length)throw Error('NO HAY CURSANTES EN ESTA SELECCIÓN.');const snapshot=structuredClone(list),cfg={...config};const blob=await ({word,excel,pdf}[formato])(snapshot,cfg,scope);if(!authorized())throw Error('SESIÓN FINALIZADA.');const ext={word:'docx',excel:'xlsx',pdf:'pdf'}[formato];save(blob,`EFM_${scope}_${snapshot[0].fecha}_${scope==='individual'?snapshot[0].c.id:(cfg.cursoLabel||'TODO_EL_CICLO').replace(/[^\w-]/g,'_')}.${ext}`);
}
export {word,excel,pdf};
