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
function server(id='P030'){
 const db={sesiones:[{token:'fixture',usuario_id:id,usuario_tabla:'profesores',expira_en:'2099-01-01',revocado:false}],profesores:[{id,activo:true,nombre_completo:id}],planif_consolidados:[],planif_calendario_enlaces:[]};let handler;
 const sb={rpc:async(name)=>({data:name==='planif_fuente_consolidada'?{semana:fixture(),propuestas:[proposal]}:db.planif_consolidados.slice(-1),error:null}),from(table){let filters=[],op='',payload,single=false;const q={select(){return q},eq(k,v){filters.push(x=>x[k]===v);return q},order(){return q},maybeSingle(){single=true;return q},single(){single=true;return q},insert(v){op='insert';payload=v;return q},update(v){op='update';payload=v;return q},then(resolve,reject){let rows=db[table].filter(x=>filters.every(f=>f(x)));if(op==='insert'){const x={id:db[table].length+1,creado_en:new Date().toISOString(),activo:true,token:'a'.repeat(64),...payload};db[table].push(x);rows=[x];}if(op==='update')rows.forEach(x=>Object.assign(x,payload));return Promise.resolve({data:JSON.parse(JSON.stringify(single?rows[0]||null:rows)),error:null}).then(resolve,reject);}};return q;}};
 let src=fs.readFileSync('supabase/functions/horario-consolidado/index.ts','utf8').replace(/^import .*;$/gm,'');src=stripTypeScriptTypes(src);
 vm.runInNewContext(src,{createClient:()=>sb,consolidar:context.consolidar,calendario:context.calendario,Deno:{env:{get:()=> 'https://fixture'},serve:fn=>handler=fn},Response,Request,Date,URL,console});
 return {db,async call(body){const res=await handler(new Request('https://fixture',{method:'POST',body:JSON.stringify({token:'fixture',...body})}));return {status:res.status,...await res.json()};},async feed(token){return handler(new Request('https://fixture?feed='+token));}};
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
 const s=server();await s.call({accion:'consolidar',semana_id:7});const a=await s.call({accion:'enlace',audiencia:'c1'}),b=await s.call({accion:'enlace',audiencia:'c1'});assert.equal(a.url,b.url);assert.equal(s.db.planif_calendario_enlaces.length,1);const feed=await s.feed('a'.repeat(64));assert.equal(feed.status,200);assert.match(feed.headers.get('content-type'),/text\/calendar/);assert.match(await feed.text(),/p1-c1-7/);assert.equal((await s.feed('bad')).status,404);await s.call({accion:'revocar',audiencia:'c1'});assert.equal((await s.feed('a'.repeat(64))).status,404);
});
function browser(){const c={window:null,document:{getElementById:()=>null},PLP:{perfil:{}},_plpBarra(){},Date,Blob,TextEncoder,setTimeout};c.window=c;vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(html.slice(html.indexOf('const _crcTable'),html.indexOf('// ── Helpers OOXML')),c);vm.runInContext(fs.readFileSync('assets/horario-consolidado.js','utf8'),c);return c;}
test('native Word export packages OOXML with both orientations, all three audiences and escaping',()=>{
 const c=browser(),record={id:1,datos:fixture(),creado_en:'2026-09-30T12:00:00Z',creado_nombre:'MORALES'};const zip=c._zipStore;let files;c._zipStore=v=>{files=v;return zip(v);};
 for(const orient of ['portrait','landscape']){const blob=c._plcDocx(record,'todos',orient);assert.match(blob.type,/wordprocessingml/);const xml=files.find(f=>f.name==='word/document.xml').str;assert.match(xml,/PERSONAL DE PLANTA/);assert.match(xml,/1ER CICLO/);assert.match(xml,/2DO CICLO/);assert.match(xml,/w:tblHeader/);assert.match(xml,new RegExp('w:w="'+(orient==='landscape'?15840:12240)+'" w:h="'+(orient==='landscape'?12240:15840)+'"'));}
});
module.exports={fixture,browser};
