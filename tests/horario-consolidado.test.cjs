const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const pure=fs.readFileSync('supabase/functions/horario-consolidado/consolidar.js','utf8').replace(/export /g,'');
const context={TextEncoder,Date,Map,Set};vm.createContext(context);vm.runInContext(pure,context);
function fixture(){return {id:7,semana_num:40,fecha_desde:'2026-10-05',fecha_hasta:'2026-10-11',datos:{cab:{},...Object.fromEntries(['planta','c1','c2'].map(k=>[k,{dias:[{iso:'2026-10-08',filas:[{desde:'11:50',hasta:'13:00',act:'TEORÍA',uc:'TEORÍA',fijo:false},{desde:'05:30',hasta:'06:30',act:'EFM',uc:'EFM',fijo:true}]},{iso:'2026-10-10',libre:'A DISPOSICIÓN DEL COMANDO',filas:[]}]}]))}};}
const proposal={id:1,fecha:'2026-10-08',desde:'12:40',hasta:'13:00',actividad:'FERIA DE NOTAS',audiencias:['c1'],estado:'aprobada'};
test('consolidation preserves source and includes only approved activities with academic recomposition',()=>{
 const sem=fixture(),before=JSON.stringify(sem),props=[proposal,{...proposal,id:2,actividad:'PENDIENTE',estado:'pendiente'},{...proposal,id:3,actividad:'RECHAZADA',estado:'rechazada'}];
 const merged=context.consolidar(sem,props);assert.equal(JSON.stringify(sem),before);assert.equal(merged.datos.c1.dias[0].filas.find(f=>f.uc==='TEORÍA').hasta,'12:40');assert.equal(merged.datos.planta.dias[0].filas[0].hasta,'13:00');assert.equal(merged.datos.c1.dias[0].filas.filter(f=>f.prop).length,1);assert.equal(merged.datos.c1.dias[0].filas.find(f=>f.uc==='EFM').hasta,'06:30');
});
test('audited deletion removes grey row and moved event appears at destination once',()=>{
 const props=[{...proposal,ocultar_base:true,mueve:{fecha:'2026-10-08',desde:'11:50',hasta:'13:00',texto:'TEORÍA'}},{...proposal,id:3,fecha:'2026-10-10',desde:'12:00',hasta:'13:00',actividad:'EFM',mueve:{fecha:'2026-10-08',desde:'05:30',hasta:'06:30',texto:'EFM'}}];
 const merged=context.consolidar(fixture(),props);assert.equal(merged.datos.c1.dias[0].filas.length,0);assert.equal(merged.datos.c1.dias[1].filas.filter(f=>f.prop===3).length,1);
});
test('all-day direct entry deduplicates unchanged day band',()=>{
 const m=context.consolidar(fixture(),[{...proposal,fecha:'2026-10-10',desde:'00:00',hasta:'23:59',actividad:'A DISPOSICIÓN DEL COMANDO',recortar:false}]);assert.equal(m.datos.c1.dias[1].filas.length,1);assert.equal(m.datos.c1.dias[1].filas[0].span,true);assert.equal(m.datos.c1.dias[1].filas[0].desde,'');
});
test('calendar uses La Paz time, exclusive all-day end, stable UID, folding and escapes',()=>{
 const sem=context.consolidar(fixture(),[proposal]);const r={id:10,datos:sem,creado_en:'2026-09-30T12:00:00Z'};
 const ics=context.calendario([r],'c1');assert.match(ics,/DTSTART:20261008T164000Z/);assert.match(ics,/DTEND;VALUE=DATE:20261011/);assert.match(ics,/UID:p1-c1-7@sideceme/);
 const next=JSON.parse(JSON.stringify(r));next.id=11;next.datos.datos.c1.dias[0].filas.find(f=>f.prop).desde='12:50';assert.match(context.calendario([next],'c1'),/UID:p1-c1-7@sideceme/);assert.match(context.calendario([next],'c1'),/SEQUENCE:11/);
 sem.datos.c1.dias[0].filas[0].uc=sem.datos.c1.dias[0].filas[0].act='Á'.repeat(200)+',;\nTEXT';const long=context.calendario([r],'c1');assert.ok(long.split('\r\n').every(l=>Buffer.byteLength(l)<=75));assert.match(long,/\\,\\;\\nTEXT/);
});
function server(id='P030',tabla='profesores',ciclo='1ER CICLO'){
 const source={semana:fixture(),propuestas:[proposal]};
 const db={sesiones:[{token:'fixture',usuario_id:id,usuario_tabla:tabla,expira_en:'2099-01-01',revocado:false}],profesores:tabla==='profesores'?[{id,activo:true,nombre_completo:id}]:[],cursantes:tabla==='cursantes'?[{id,activo:true,nombre_completo:id,ciclo}]:[],planif_consolidados:[],planif_calendario_enlaces:[],planif_publicaciones:[],planif_semanas:[{id:7,activo:true}]};let handler;
 const sb={rpc:async(name)=>({data:name==='planif_fuente_consolidada'?source:db.planif_consolidados.slice(-1),error:null}),from(table){let filters=[],op='',payload,single=false;const q={select(){return q},eq(k,v){filters.push(x=>x[k]===v);return q},in(k,v){filters.push(x=>v.includes(x[k]));return q},order(){return q},maybeSingle(){single=true;return q},single(){single=true;return q},insert(v){op='insert';payload=v;return q},update(v){op='update';payload=v;return q},upsert(v){op='upsert';payload=v;return q},then(resolve,reject){let rows=db[table].filter(x=>filters.every(f=>f(x)));if(op==='insert'){const x={id:db[table].length+1,creado_en:new Date().toISOString(),activo:true,token:'a'.repeat(64),...payload};db[table].push(x);rows=[x];}if(op==='upsert'){const existing=db[table].find(x=>x.semana_id===payload.semana_id);if(existing){Object.assign(existing,payload);rows=[existing];}else{const x={...payload};db[table].push(x);rows=[x];}}if(op==='update')rows.forEach(x=>Object.assign(x,payload));return Promise.resolve({data:JSON.parse(JSON.stringify(single?rows[0]||null:rows)),error:null}).then(resolve,reject);}};return q;}};
 let src=fs.readFileSync('supabase/functions/horario-consolidado/index.ts','utf8').replace(/^import .*;$/gm,'');src=stripTypeScriptTypes(src);
 vm.runInNewContext(src,{createClient:()=>sb,consolidar:context.consolidar,calendario:context.calendario,Deno:{env:{get:()=> 'https://fixture'},serve:fn=>handler=fn},Response,Request,Date,URL,console});
 return {db,source,async call(body){const res=await handler(new Request('https://fixture',{method:'POST',body:JSON.stringify({token:'fixture',...body})}));return {status:res.status,...await res.json()};},async feed(token){return handler(new Request('https://fixture?feed='+token));}};
}
test('only three authorized active users with valid sessions can archive or get links',async()=>{
 for(const id of ['P030','P032','S002'])assert.equal((await server(id).call({accion:'listar',semana_id:7})).ok,true);
 for(const id of ['P002','P009']){const s=server(id);assert.equal((await s.call({accion:'consolidar',semana_id:7})).status,403);assert.equal(s.db.planif_consolidados.length,0);}
 for(const field of ['expired','revoked','inactive']){const s=server();if(field==='expired')s.db.sesiones[0].expira_en='2000-01-01';if(field==='revoked')s.db.sesiones[0].revocado=true;if(field==='inactive')s.db.profesores[0].activo=false;assert.equal((await s.call({accion:'enlace',audiencia:'c1'})).status,403);}
});
test('archive creates immutable versions from server data and ignores client-supplied schedule',async()=>{
 const s=server();const first=await s.call({accion:'consolidar',semana_id:7,orientacion:'landscape',datos:{malicious:true}});assert.equal(first.record.datos.id,7);const snapshot=JSON.stringify(s.db.planif_consolidados[0]);const second=await s.call({accion:'consolidar',semana_id:7,orientacion:'portrait'});assert.notEqual(first.record.id,second.record.id);assert.equal(JSON.stringify(s.db.planif_consolidados[0]),snapshot);
});
test('subscription reuses link, scopes audience and revocation blocks access',async()=>{
 const s=server();const archive=await s.call({accion:'consolidar',semana_id:7});await s.call({accion:'publicar',id:archive.record.id});const a=await s.call({accion:'enlace',audiencia:'c1'}),b=await s.call({accion:'enlace',audiencia:'c1'});assert.equal(a.url,b.url);assert.equal(s.db.planif_calendario_enlaces.length,1);const feed=await s.feed('a'.repeat(64));assert.equal(feed.status,200);assert.match(feed.headers.get('content-type'),/text\/calendar/);assert.match(await feed.text(),/p1-c1-7/);assert.equal((await s.feed('bad')).status,404);await s.call({accion:'revocar',audiencia:'c1'});assert.equal((await s.feed('a'.repeat(64))).status,404);
});
function browser(){const c={window:null,document:{getElementById:()=>null},PLP:{perfil:{}},_plpBarra(){},Date,Blob,TextEncoder,setTimeout};c.window=c;vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(html.slice(html.indexOf('const _crcTable'),html.indexOf('// ── Helpers OOXML')),c);vm.runInContext(fs.readFileSync('assets/horario-documento.js','utf8'),c);vm.runInContext(fs.readFileSync('assets/horario-consolidado.js','utf8'),c);return c;}
test('native Word export packages OOXML with both orientations, all three audiences and escaping',()=>{
 const c=browser(),record={id:1,datos:fixture(),creado_en:'2026-09-30T12:00:00Z',creado_nombre:'MORALES'};const zip=c._zipStore;let files;c._zipStore=v=>{files=v;return zip(v);};
 for(const orient of ['portrait','landscape']){const blob=c._plcDocx(record,'todos',orient);assert.match(blob.type,/wordprocessingml/);const xml=files.find(f=>f.name==='word/document.xml').str;assert.match(xml,/PERSONAL DE PLANTA/);assert.match(xml,/1ER. CICLO/);assert.match(xml,/2DO. CICLO/);assert.match(xml,/w:tblHeader/);assert.match(xml,new RegExp('w:w="'+(orient==='landscape'?15840:12240)+'" w:h="'+(orient==='landscape'?12240:15840)+'"'));}
});
test('publication selects final version, keeps archive and rejects stale saved data',async()=>{
 const s=server();const a=await s.call({accion:'consolidar',semana_id:7});assert.equal((await s.call({accion:'publicados'})).records.length,0);
 const p=await s.call({accion:'publicar',id:a.record.id});assert.equal(p.ok,true);assert.equal((await s.call({accion:'publicados'})).records[0].id,a.record.id);
 s.source.semana.datos.c1.dias[0].filas[0].uc='MODIFICADA';assert.equal((await s.call({accion:'publicar',id:a.record.id})).status,409);
 const b=await s.call({accion:'consolidar',semana_id:7});assert.equal((await s.call({accion:'publicados'})).records[0].id,a.record.id);await s.call({accion:'publicar',id:b.record.id});assert.equal((await s.call({accion:'publicados'})).records[0].id,b.record.id);assert.equal(s.db.planif_consolidados.length,2);assert.equal(s.db.planif_publicaciones.length,1);
});
test('publication ignores JSON key order after JSONB persistence',async()=>{
 const s=server();const a=await s.call({accion:'consolidar',semana_id:7});const d=s.db.planif_consolidados[0].datos.datos;d.cab={b:2,a:1};s.source.semana.datos.cab={a:1,b:2};assert.equal((await s.call({accion:'publicar',id:a.record.id})).ok,true);
});
test('cursantes read only their published cycle and cannot consolidate or publish',async()=>{
 const s=server('A1','cursantes');s.db.planif_consolidados.push({id:1,semana_id:7,datos:fixture(),creado_en:new Date().toISOString()});s.db.planif_publicaciones.push({semana_id:7,consolidado_id:1});const r=await s.call({accion:'publicados'});assert.deepEqual(r.audiencias,['c1']);assert.ok(r.records[0].datos.datos.c1);assert.equal(r.records[0].datos.datos.c2,undefined);assert.equal(r.records[0].datos.datos.planta,undefined);assert.equal((await s.call({accion:'publicar',id:1})).status,403);assert.equal((await s.call({accion:'consolidar',semana_id:7})).status,403);assert.equal((await s.call({accion:'enlace',audiencia:'c2'})).status,403);assert.equal((await s.call({accion:'enlace',audiencia:'c1'})).ok,true);
 s.db.cursantes[0].ciclo='2DO CICLO';const link=await s.feed('a'.repeat(64));assert.equal(link.status,404);
});
test('calendar excludes saved drafts and contains only published versions',async()=>{
 const s=server();await s.call({accion:'consolidar',semana_id:7});const r=await s.call({accion:'enlace',audiencia:'c1'});assert.equal(r.status,409);assert.match(r.error,/PUBLICAR PARA TODO EL PERSONAL/);assert.equal(s.db.planif_calendario_enlaces.length,0);
});
test('official Word retains day merges, timed spans, activity columns and footer',()=>{
 const c=browser();let files;c._zipStore=v=>{files=v;return new Blob([]);};const f=fixture();f.datos.planta.dias[0].filas.push({desde:'09:30',hasta:'10:00',act:'DESCANSO',span:true});f.datos.c1.dias[0].filas.push({desde:'07:30',hasta:'08:00',uc:'PARTE',act3:true,lugar:'PATIO'});c._plcDocx({datos:f},'todos','modelo');const xml=files.find(x=>x.name==='word/document.xml').str;assert.match(xml,/w:vMerge w:val="restart"/);assert.match(xml,/w:vMerge w:val="continue"/);assert.match(xml,/HORAS/);assert.match(xml,/09:30/);assert.match(xml,/w:gridSpan w:val="3"/);assert.match(xml,/w:gridSpan w:val="5"/);assert.ok(files.some(x=>x.name==='word/footer1.xml'&&x.str.includes('NUMPAGES')));
});
module.exports={fixture,browser};

test('staff can subscribe to all schedules, students cannot mint or use a combined link',async()=>{
 const staff=server('P009');staff.db.planif_consolidados.push({id:1,semana_id:7,datos:fixture(),creado_en:new Date().toISOString()});staff.db.planif_publicaciones.push({semana_id:7,consolidado_id:1});assert.equal((await staff.call({accion:'enlace',audiencia:'todos'})).ok,true);
 const student=server('A1','cursantes');assert.equal((await student.call({accion:'enlace',audiencia:'todos'})).status,403);
 assert.equal((await student.call({accion:'revocar',audiencia:'todos'})).status,403);
 assert.deepEqual((await student.call({accion:'publicados'})).audiencias,['c1']);
 student.db.planif_calendario_enlaces.push({propietario:'A1',propietario_tabla:'cursantes',audiencia:'todos',activo:true,token:'a'.repeat(64)});
 assert.equal((await student.feed('a'.repeat(64))).status,404);
});
test('combined calendar contains labeled events for all three audiences and preserves individual UIDs',()=>{
 const f=fixture();for(const [i,k] of ['planta','c1','c2'].entries())f.datos[k].dias=[{iso:'2026-10-08',filas:[{desde:'08:00',hasta:'09:00',act:'ACTIVIDAD '+k,prop:900+i}]}];
 const r={id:3,datos:f,creado_en:'2026-09-30T12:00:00Z'},ics=context.calendario([r],'todos');
 assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,3);
 for(const [k,label] of [['planta','PLANTA'],['c1','1ER CICLO'],['c2','2DO CICLO']]){assert.ok(ics.includes('SUMMARY:['+label+'] ACTIVIDAD '+k));const uid=context.calendario([r],k).match(/UID:([^\r]+)/)[1];assert.ok(ics.includes('UID:'+uid));}
});
test('direct calendar destinations include the prepared subscription URL without manual copying',()=>{
 const c=browser();c.URL=URL;const url='https://example.test/feed?token=a&scope=todos',links=c._plcCalendarLinks(url);
 assert.equal(links.apple,'webcal://example.test/feed?token=a&scope=todos');
 const google=new URL(links.google);assert.equal(google.hostname,'calendar.google.com');assert.equal(google.searchParams.get('cid'),links.apple);
 assert.throws(()=>c._plcCalendarLinks('javascript:alert(1)'));
});
