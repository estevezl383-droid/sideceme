const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const html=fs.readFileSync('index.html','utf8');
const core=html.slice(html.indexOf('const PLP ='),html.indexOf('</script>',html.indexOf('const PLP =')));
const patch=fs.readFileSync('assets/horario-419.js','utf8');
function client(){
 const dlg={innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[],classList:{add(){}}},modal={hidden:true};
 const c={console,Date,Set,JSON,setTimeout(){},setInterval(){},alert:m=>{throw Error(m)},document:{hidden:false,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,getElementById:id=>id==='plp-dlg'?dlg:id==='plp-modal'?modal:null},localStorage:{getItem:()=>null,setItem(){}},_plEsc:v=>String(v??''),_plDiaNombre:()=> 'JUEVES',_plDiaNum:()=> '08',PLANIF:{},getTokenSesion:()=> 'fixture'};
 c.window=c;vm.createContext(c);vm.runInContext(core,c);vm.runInContext(patch,c);c.state=vm.runInContext('PLP',c);c.dlg=dlg;return c;
}
const feria={id:1,version:1,estado:'pendiente',creado_por:'P008',creado_por_nombre:'SOLICITANTE',fecha:'2026-10-08',desde:'12:00',hasta:'13:00',actividad:'FERIA DE NOTAS',audiencias:['c1'],recortar:true};
test('Baptista can edit another section, ordinary teachers cannot',()=>{
 const c=client();c.state.perfil={id:'P002',aprobar:true};assert.equal(c._plpPuedeEditar(feria),true);c._plpForm(feria);assert.doesNotMatch(c.dlg.innerHTML,/plp-f-desde[^>]+disabled/);assert.doesNotMatch(c.dlg.innerHTML,/Es de otra sección/);
 c.state.perfil={id:'P009',proponer:true};assert.equal(c._plpPuedeEditar(feria),false);c._plpForm(feria);assert.match(c.dlg.innerHTML,/plp-f-desde[^>]+disabled/);
});
test('changing feria to 12:40 restores academic base to 12:40 and leaves stored base intact',()=>{
 const c=client(),base={dias:[{iso:'2026-10-08',filas:[{desde:'11:50',hasta:'13:00',uc:'TEORÍA',modulo:'ACADÉMICO'},{desde:'05:30',hasta:'06:30',uc:'EFM',fijo:true}]}]};
 const original=JSON.stringify(base),old=c._plpMezclarBloque('c1',base,[{...feria,estado:'aprobada'}],{}),newer=c._plpMezclarBloque('c1',base,[{...feria,desde:'12:40',estado:'aprobada'}],{});
 assert.equal(old.dias[0].filas.find(f=>f.uc==='TEORÍA').hasta,'12:00');assert.equal(newer.dias[0].filas.find(f=>f.uc==='TEORÍA').hasta,'12:40');assert.equal(newer.dias[0].filas.find(f=>f.uc==='EFM').hasta,'06:30');assert.equal(JSON.stringify(base),original);
});
test('direct planning activity has no requester and all-day duplicate band appears once',()=>{
 const c=client();c.state.perfil={id:'P030',mover:true};c.state.conBase=true;c.state.vista='planta';c.state.props=[{...feria,id:2,creado_por:'P030',creado_por_nombre:'MORALES',estado:'aprobada',fecha:'2026-10-10',desde:'00:00',hasta:'23:59',actividad:'A DISPOSICIÓN DEL COMANDO',audiencias:['planta']}];c.state.semanas=[{datos:{planta:{dias:[{iso:'2026-10-10',libre:'A DISPOSICIÓN DEL COMANDO',filas:[]}]}}}];
 const ev=c._plpArmarEventos();assert.equal(ev.length,1);assert.equal(ev[0].allDay,true);assert.ok(ev[0].extendedProps.cls.includes('plp-planificacion-directa'));const rendered=c._plpContenido({event:ev[0],timeText:''}).html;assert.doesNotMatch(rendered,/MORALES|APROBADA|👤/);assert.match(rendered,/A DISPOSICIÓN/);
});
test('approve with changed hours performs one atomic save and no second approval',async()=>{
 const c=client();c.state.perfil={id:'P002',aprobar:true};c.state.edit={p:feria,original:'old'};c._plpLeerForm=()=>({...feria,desde:'12:40'});c._plpValidar=()=>null;const calls=[];c._plpInvoke=async(a,e)=>{calls.push({a,e});return {ok:true,propuesta:{...feria,version:2,estado:'aprobada'}}};c._plpRecargar=()=>{};await c.plpAprobar();assert.equal(calls.length,1);assert.equal(calls[0].a,'guardar');assert.equal(calls[0].e.campos.desde,'12:40');
});
function server(role){
 const data={sesiones:[{token:'fixture',usuario_id:role,usuario_tabla:'profesores',expira_en:'2099-01-01',revocado:false}],profesores:[{id:role,rol:'profesor',activo:true,nombre_completo:role}],planif_editores:[{profesor_id:role,activo:true,puede_aprobar:role==='P002',puede_mover:role==='P030',puede_proponer:true}],planif_semanas:[{id:7,activo:true,fecha_desde:'2026-10-05',fecha_hasta:'2026-10-11',prop_cierre:'2000-01-01'}],planif_propuestas:[{...feria,semana_id:7}],planif_propuestas_log:[]};let handler;
 const sb={from(table){let rows=data[table],filters=[],op=null,payload;const q={select(){return q},eq(k,v){filters.push(x=>x[k]===v);return q},neq(k,v){filters.push(x=>x[k]!==v);return q},in(k,a){filters.push(x=>a.includes(x[k]));return q},gte(k,v){filters.push(x=>x[k]>=v);return q},lte(k,v){filters.push(x=>x[k]<=v);return q},order(){return q},limit(){return q},update(x){op='update';payload=x;return q},insert(x){op='insert';payload=x;return q},then(resolve,reject){let selected=rows.filter(x=>filters.every(f=>f(x)));if(op==='update')selected.forEach(x=>Object.assign(x,payload));if(op==='insert'){const x={id:rows.length+1,...payload};rows.push(x);selected=[x]}return Promise.resolve({data:JSON.parse(JSON.stringify(selected)),error:null}).then(resolve,reject)}};return q}};
 let src=fs.readFileSync('supabase/functions/planif-propuestas/index.ts','utf8').replace(/import \{ createClient \} from [^;]+;/,'');
 src=stripTypeScriptTypes(src);vm.runInNewContext(src,{createClient:()=>sb,Deno:{env:{get:()=>''},serve:fn=>handler=fn},Response,Request,Date,console});
 return {data,async call(body){const r=await handler(new Request('http://fixture',{method:'POST',body:JSON.stringify({token:'fixture',...body})}));return {status:r.status,...await r.json()}}};
}
test('server lets Baptista edit/approve after closure, but blocks another section',async()=>{
 const s=server('P002');let r=await s.call({accion:'guardar',id:1,version:1,campos:{desde:'12:40'}});assert.equal(r.ok,true);assert.equal(r.propuesta.estado,'aprobada');assert.equal(r.propuesta.desde,'12:40');assert.equal(s.data.planif_propuestas_log[0].antes.desde,'12:00');
 const denied=await server('P009').call({accion:'guardar',id:1,version:1,campos:{desde:'12:40'}});assert.equal(denied.status,403);
});
test('server notices contain only current requester decisions',async()=>{
 const s=server('P008');s.data.planif_propuestas_log=[{id:1,propuesta_id:1,usuario_id:'P002',accion:'modificar',en:new Date().toISOString(),antes:feria,despues:{...feria,estado:'aprobada',desde:'12:40'}},{id:2,propuesta_id:2,usuario_id:'P002',accion:'rechazar',en:new Date().toISOString(),despues:{...feria,creado_por:'P009',estado:'rechazada'}}];const r=await s.call({accion:'avisos',usuario_id:'P009'});assert.equal(r.avisos.length,1);assert.equal(r.avisos[0].id,1);assert.equal(r.avisos[0].despues.desde,'12:40');
});
test('red notice shows rejection reason and stays until explicit acknowledgement',async()=>{
 const c=client(),saved=new Map(),container={children:[],prepend(el){this.children.unshift(el)}};
 c.localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 c.document.querySelector=()=>({querySelector:()=>container});
 c.document.querySelectorAll=()=>container.children;
 c.document.createElement=()=>({remove(){container.children=container.children.filter(e=>e!==this)}});
 c._plpPerfil=async()=>({id:'P008'});c._plpInvoke=async()=>({ok:true,avisos:[{id:9,autoridad:'BAPTISTA',antes:feria,despues:{...feria,estado:'rechazada',motivo_rechazo:'COINCIDE CON EXAMEN'},propuesta:feria}]});
 await c.plpAvisosActualizar();assert.match(container.children[0].textContent,/TIENES 1 AVISO/);assert.equal(container.children[0].className,'plp-alerta-personal');c.plpAvisosAbrir();assert.match(c.dlg.innerHTML,/SOLICITUD RECHAZADA|COINCIDE CON EXAMEN/);c._plpCerrarModal();await c.plpAvisosActualizar();assert.equal(container.children.length,1);c.plpAvisoLeido(9);assert.equal(container.children.length,0);await c.plpAvisosActualizar();assert.equal(container.children.length,0);
});
test('server planning saves are direct and stale concurrent edits fail',async()=>{
 const s=server('P030');const first=await s.call({accion:'guardar',id:1,version:1,campos:{desde:'12:40'}});assert.equal(first.propuesta.estado,'aprobada');const stale=await s.call({accion:'guardar',id:1,version:1,campos:{desde:'12:45'}});assert.equal(stale.status,409);assert.equal(s.data.planif_propuestas[0].desde,'12:40');
});
