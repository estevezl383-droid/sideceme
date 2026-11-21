const {test,before,beforeEach,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {PGlite} = require(process.env.SIDECEME_PGLITE_MODULE || '@electric-sql/pglite');
let db;
const snapshot = {falta_id:'uniforme',puntos_aplicados:4,modificada_en:null};
const cambios = extra => ({falta_id:'parte',puntos_aplicados:2,anterior:snapshot,...extra});
const resolver = (mod=cambios(), actor='disc', decision='modificar') => db.query(
  'select resolver_solicitud_atomica(1,$1,$2,$3,$4) resultado', [actor,decision,'Corrección aprobada según solicitud',mod]);
const estado = async () => (await db.query(`select s.puntos_aplicados,s.falta_id,s.es_reincidencia,s.reincidencia_num,
  so.estado,c.puntos_vigentes,(select count(*)::integer from sanciones_audit) auditorias
  from sanciones s join solicitudes_anulacion so on so.sancion_id=s.id join cursantes c on c.id=s.cursante_id`)).rows[0];
before(async()=>{
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table profesores(id text primary key,nombre_completo text,activo boolean,es_auxiliar boolean,solo_lectura boolean,rol text,roles text[]);
    create table cursantes(id text primary key,puntos_vigentes numeric);
    create table reglamentos(id text primary key,articulo integer,descripcion text,categoria text,puntos integer,activo boolean);
    create table sanciones(id text primary key,cursante_id text,falta_id text,falta_articulo text,falta_descripcion text,falta_categoria text,
      puntos_base integer,puntos_aplicados integer,es_reincidencia boolean,reincidencia_num integer,requiere_memorandum boolean,requiere_consejo boolean,
      estado text,anulada boolean,modificada_en timestamptz,modificada_por text,modificada_motivo text,registro_generado boolean);
    create table solicitudes_anulacion(id bigint primary key,sancion_id text,cursante_id text,creada_por text,estado text,
      enviado_a_comandante boolean,enviado_a_estudios boolean,origen text,cursante_nombre text,profesor_nombre text,
      detalle_cursante text,detalle_profesor text,comentario_disciplina text,comentario_comandante text,fecha_creacion timestamptz,fecha_resolucion timestamptz);
    create table sanciones_audit(sancion_id text,accion text,realizado_por text,realizado_por_nombre text,campos_antes jsonb,campos_despues jsonb,
      razon text,registro_generado boolean,estado_antes text,estado_despues text,puntos_antes integer,puntos_despues integer,
      solicitante_nombre text,solicitud_fecha timestamptz,solicitud_motivo text,decision_final text);
    create function recalc() returns trigger language plpgsql as $$ begin
      update cursantes set puntos_vigentes=(select sum(puntos_aplicados) from sanciones where cursante_id=new.cursante_id and anulada is not true) where id=new.cursante_id;
      return new; end $$;
    create trigger recalc after insert or update on sanciones for each row execute function recalc();`);
  await db.exec(fs.readFileSync('supabase/seguridad/009_resolucion_solicitud_atomica.sql','utf8'));
});
beforeEach(async()=>{
  await db.exec(`truncate sanciones_audit,solicitudes_anulacion,sanciones,reglamentos,cursantes,profesores;
    insert into profesores values ('disc','Responsable de prueba',true,false,false,'jefe_disciplina','{}'),
      ('aux','Auxiliar',true,true,false,'jefe_disciplina','{}'),('lect','Consulta',true,false,true,'jefe_disciplina','{}'),
      ('cmd','Comandante',true,false,false,'comandante','{}'),('doc','Docente',true,false,false,'profesor','{}'),
      ('multi','Responsable adicional',true,false,false,'profesor','{jefe_disciplina}');
    insert into cursantes values('alumna',0);
    insert into reglamentos values('uniforme',8,'Uniforme de prueba','LEVE',2,true),('parte',8,'Parte de prueba','LEVE',2,true),('baja',8,'Inactiva','LEVE',2,false);
    insert into sanciones values('s1','alumna','uniforme','8','Uniforme de prueba','LEVE',2,4,true,1,false,false,null,false,null,null,null,false);
    insert into solicitudes_anulacion(id,sancion_id,cursante_id,creada_por,estado,origen,profesor_nombre,detalle_profesor,fecha_creacion)
      values(1,'s1','alumna','doc','pendiente','profesor','Docente solicitante','Reducir a dos puntos',now());`);
});
after(async()=>{await db?.close();});
test('aprobación, cambio, reincidencia, acumulado y auditoría se guardan juntos',async()=>{
  const result = (await resolver()).rows[0].resultado;
  assert.equal(result.sancion.puntos_aplicados,2);
  assert.deepEqual(await estado(),{puntos_aplicados:2,falta_id:'parte',es_reincidencia:false,reincidencia_num:0,estado:'aprobado',puntos_vigentes:'2',auditorias:1});
  const a = (await db.query('select * from sanciones_audit')).rows[0];
  assert.equal(a.puntos_antes,4);assert.equal(a.puntos_despues,2);assert.equal(a.campos_despues.solicitud_id,1);
  assert.equal(a.solicitante_nombre,'Docente solicitante');assert.equal(a.realizado_por,'disc');
});
test('un cliente anterior sin valores finales no puede aprobar',async()=>{
  await assert.rejects(resolver(null),/Seleccioná la falta/);assert.equal((await estado()).estado,'pendiente');
});
test('rechaza puntos inválidos, falta inactiva y cambios vacíos',async()=>{
  for(const valor of [0,-2,2.5,3,null,'abc']) await assert.rejects(resolver(cambios({puntos_aplicados:valor})),/puntos/i);
  await assert.rejects(resolver(cambios({falta_id:'baja'})),/vigente/);
  await assert.rejects(resolver(cambios({falta_id:'uniforme',puntos_aplicados:4})),/No hay cambios/);
  assert.equal((await estado()).auditorias,0);
});
test('rechaza una vista desactualizada',async()=>{
  await db.exec("update sanciones set puntos_aplicados=2");
  await assert.rejects(resolver(),/La sanción cambió/);assert.equal((await estado()).estado,'pendiente');
});
test('un segundo envío no vuelve a editar ni duplica la auditoría',async()=>{
  await resolver();await assert.rejects(resolver(),/ya fue resuelta/);assert.equal((await estado()).auditorias,1);
});
test('si falla la auditoría revierte sanción, acumulado y aprobación',async()=>{
  await db.exec('alter table sanciones_audit add constraint fallo_simulado check(puntos_despues<>2)');
  try{await assert.rejects(resolver(),/fallo_simulado/);
    assert.deepEqual(await estado(),{puntos_aplicados:4,falta_id:'uniforme',es_reincidencia:true,reincidencia_num:1,estado:'pendiente',puntos_vigentes:'4',auditorias:0});
  }finally{await db.exec('alter table sanciones_audit drop constraint fallo_simulado');}
});
test('respeta auxiliares, consulta, docentes y conducto regular',async()=>{
  for(const actor of ['aux','lect','doc','cmd','inexistente']) await assert.rejects(resolver(cambios(),actor),/atribución/);
  await db.exec('update solicitudes_anulacion set enviado_a_comandante=true');
  await resolver(cambios(),'cmd');assert.equal((await estado()).estado,'aprobado');
});
test('admite el cargo adicional autorizado y reincidencia explícita',async()=>{
  await resolver(cambios({puntos_aplicados:4}),'multi');assert.equal((await estado()).reincidencia_num,1);
});
test('un rol nulo no adquiere permisos por recibir una elevación',async()=>{
  await db.exec("update profesores set rol=null,roles=null where id='doc'; update solicitudes_anulacion set enviado_a_comandante=true,enviado_a_estudios=true");
  await assert.rejects(resolver(cambios(),'doc'),/atribución/);
});
test('rechazar mantiene la sanción y anular exige anulación previa',async()=>{
  await assert.rejects(resolver(null,'disc','anular'),/todavía no figura anulada/);
  await resolver(null,'disc','rechazar');const s=await estado();assert.equal(s.estado,'rechazado');assert.equal(s.puntos_aplicados,4);assert.equal(s.auditorias,0);
});
test('no modifica sanciones anuladas',async()=>{
  await db.exec('update sanciones set anulada=true');await assert.rejects(resolver(),/anulada/);
});
test('anon y authenticated no pueden invocar la función privilegiada',async()=>{
  for(const role of ['anon','authenticated']){
    await db.exec('set role '+role);
    try{await assert.rejects(resolver(),/permission denied for function/);}finally{await db.exec('reset role');}
  }
});
