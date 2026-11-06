-- Expediente de admisión independiente: no inserta cursantes ni sanciones.
-- Aplicar con un rol de administración. API exclusivamente por postulantes-ops.
create table public.post_convocatorias (
 id integer primary key, nombre text not null, referencia_fin date not null,
 acceso_abierto boolean not null default true, version integer not null default 1,
 directiva_referencia text, directiva_sha256 text, directiva_validada boolean not null default false,
 cierre_motivo text, cierre_actor text, cierre_en timestamptz
);
insert into public.post_convocatorias(id,nombre,referencia_fin) values(2027,'Postulación a la ECEME · Gestión 2027','2026-11-27');
create table public.post_permisos (
 profesor_id text primary key references public.profesores(id),
 administrar boolean not null default false, academicas boolean not null default false,
 fisica boolean not null default false, certificar boolean not null default false
);
insert into public.post_permisos values
 ('P001',false,false,false,true),('P002',true,true,false,true),
 ('P032',false,false,false,false),('P020',false,false,true,false),('P030',true,true,true,true);
create table public.post_materias (
 codigo text primary key, nombre text not null, tipo text not null check(tipo in ('ACADEMICA','FISICA','MEDICA','PSICOLOGICA')),
 orden integer not null unique, inicio timestamptz not null, fin timestamptz not null
);
-- Fechas transcritas únicamente de las imágenes aportadas. Hora de Bolivia.
insert into public.post_materias values
 ('PMTD','Proceso Militar para la Toma de Decisiones · RO-06-01-04 · Ed. 2007','ACADEMICA',1,'2026-11-16 14:30-04','2026-11-16 18:00-04'),
 ('PICB','Preparación de Inteligencia del Campo de Batalla · RO-02-01-03 · Ed. 2007','ACADEMICA',2,'2026-11-17 08:00-04','2026-11-17 12:00-04'),
 ('TG','Táctica General · RC-02-02 · Ed. 1992 · Págs. 165–254','ACADEMICA',3,'2026-11-17 14:30-04','2026-11-17 18:00-04'),
 ('TT','Tareas Tácticas · RO-06-03-01 · Ed. 2007','ACADEMICA',4,'2026-11-18 08:00-04','2026-11-18 12:00-04'),
 ('PM','Planas Mayores · Texto ECEME 2026','ACADEMICA',5,'2026-11-18 14:30-04','2026-11-18 18:00-04'),
 ('HMB','Historia Militar de Bolivia · Texto ECEME 2026','ACADEMICA',6,'2026-11-19 08:00-04','2026-11-19 11:30-04'),
 ('EF','Evaluación física','FISICA',7,'2026-11-20 07:00-04','2026-11-20 14:00-04'),
 ('MED','Revisión médica','MEDICA',8,'2026-11-19 12:30-04','2026-11-19 18:30-04'),
 ('PSI','Evaluación psicológica','PSICOLOGICA',9,'2026-11-16 08:00-04','2026-11-16 12:00-04');
create table public.post_postulantes (
 id uuid primary key default gen_random_uuid(), convocatoria_id integer not null references public.post_convocatorias(id) default 2027,
 ci text not null check(ci ~ '^[0-9]{4,12}(-[0-9A-Z]{1,4})?$'),
 nombre_completo text not null check(length(trim(nombre_completo)) between 5 and 180),
 grado text not null default '', arma text not null default '', filiacion jsonb not null default '{}',
 foto text check(foto is null or (length(foto)<=1500000 and foto ~ '^data:image/(jpeg|png);base64,')),
 fuente text not null default '', identidad_verificada boolean not null default false,
 habilitado boolean not null default false, password_hash text not null, primer_ingreso boolean not null default true,
 revision integer not null default 1, creado_en timestamptz not null default now(),
 unique(convocatoria_id,ci), check(not habilitado or (identidad_verificada and foto is not null))
);
create table public.post_sesiones (
 hash text primary key, postulante_id uuid not null references public.post_postulantes(id),
 expira_en timestamptz not null, revocada boolean not null default false, creada_en timestamptz not null default now()
);
create index on public.post_sesiones(postulante_id);
create table public.post_intentos (
 id bigint generated always as identity primary key, clave text not null, ip text not null,
 creado_en timestamptz not null default now(), correcto boolean not null
);
create index on public.post_intentos(clave,creado_en desc);
create index on public.post_intentos(ip,creado_en desc);
create table public.post_evaluaciones (
 id uuid primary key default gen_random_uuid(), postulante_id uuid not null references public.post_postulantes(id),
 materia text not null references public.post_materias(codigo), nota numeric, escala numeric,
 resultado text not null check(resultado in ('EVALUADO','APTO','NO_APTO','AUSENTE','PENDIENTE')),
 detalle jsonb not null default '{}', observacion text not null default '', referencia text not null,
 publicada boolean not null default false, revision integer not null, actor text not null,
 registrada_en timestamptz not null default now(), unique(postulante_id,materia),
 check((nota is null and escala is null) or (nota is not null and escala is not null and escala>0 and nota>=0 and nota<=escala)),
 check(resultado not in ('AUSENTE','PENDIENTE') or nota is null)
);
create table public.post_historial (
 id bigint generated always as identity primary key, postulante_id uuid references public.post_postulantes(id),
 accion text not null, actor text not null, motivo text not null, anterior jsonb, nuevo jsonb,
 creado_en timestamptz not null default now()
);
create index on public.post_historial(postulante_id,creado_en desc);
create table public.post_conformidades (
 evaluacion_id uuid not null references public.post_evaluaciones(id), revision integer not null,
 postulante_id uuid not null references public.post_postulantes(id), creado_en timestamptz not null default now(),
 primary key(evaluacion_id,revision)
);
create table public.post_certificados (
 id uuid primary key default gen_random_uuid(), postulante_id uuid not null references public.post_postulantes(id),
 tipo text not null check(tipo in ('REGISTRO_PARCIAL','CERTIFICADO')), contenido jsonb not null,
 contenido_sha256 text not null, pdf_sha256 text, pdf_base64 text,
 emisor text not null, emitido_en timestamptz not null default now(),
 anulado_en timestamptz, anulacion_motivo text
);
create index on public.post_certificados(postulante_id,emitido_en desc);
-- Sin políticas públicas: la autenticación propia se verifica dentro de la RPC.
do $$ declare t text; begin
 foreach t in array array['post_convocatorias','post_permisos','post_materias','post_postulantes','post_sesiones','post_intentos','post_evaluaciones','post_historial','post_conformidades','post_certificados'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.post_intentos_id_seq,public.post_historial_id_seq to service_role;

create function public.post_operar(p_accion text,p_token text default '',p_datos jsonb default '{}',p_ip text default '')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 c public.post_convocatorias; p public.post_postulantes; s public.post_sesiones;
 a public.profesores; perm public.post_permisos; ses public.sesiones; e public.post_evaluaciones;
 m public.post_materias; cert public.post_certificados;
 actor text; es_admin boolean:=false; pid uuid; v_ci text; tk text; v_clave text; previo jsonb; nuevo jsonb;
 filas jsonb; hist jsonb; materias jsonb; certs jsonb; cuerpo jsonb; cant integer; rev integer;
begin
 select * into c from public.post_convocatorias where id=2027 for share;
 if c.id is null then raise exception 'CONVOCATORIA NO CONFIGURADA'; end if;
 if p_accion='verificar' then
  select * into cert from public.post_certificados where id=(p_datos->>'id')::uuid;
  if cert.id is null or cert.pdf_sha256 is null then return jsonb_build_object('ok',false,'error','DOCUMENTO NO ENCONTRADO'); end if;
  return jsonb_build_object('ok',true,'folio',cert.id,'tipo',cert.tipo,'emitido_en',cert.emitido_en,
   'anulado',cert.anulado_en is not null,'pdf_sha256',cert.pdf_sha256,'contenido_sha256',cert.contenido_sha256);
 end if;
 if p_accion='ingresar' then
  v_ci:=upper(regexp_replace(trim(coalesce(p_datos->>'ci','')),'\s','','g'));
  if v_ci !~ '^[0-9]{4,12}(-[0-9A-Z]{1,4})?$' or length(coalesce(p_datos->>'password','')) not between 1 and 72 then raise exception 'CI O CONTRASEÑA INCORRECTOS'; end if;
  v_clave:=encode(extensions.digest(v_ci,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended('post-login:'||p_ip,0));
  perform pg_advisory_xact_lock(hashtextextended('post-login-ci:'||v_clave,0));
  select count(*) into cant from public.post_intentos where creado_en>now()-interval '10 minutes' and not correcto and (post_intentos.clave=v_clave or ip=p_ip);
  if (select count(*) from public.post_intentos where creado_en>now()-interval '10 minutes' and not correcto and post_intentos.clave=v_clave)>=8 or cant>=80 then return jsonb_build_object('ok',false,'error','DEMASIADOS INTENTOS. ESPERE 10 MINUTOS.'); end if;
  select * into p from public.post_postulantes where convocatoria_id=2027 and post_postulantes.ci=v_ci;
  if p.id is null or not p.habilitado or not c.acceso_abierto or p.password_hash<>extensions.crypt(p_datos->>'password',p.password_hash) then
   insert into public.post_intentos(clave,ip,correcto) values(v_clave,p_ip,false);
   return jsonb_build_object('ok',false,'error','CI O CONTRASEÑA INCORRECTOS, O ACCESO NO HABILITADO.');
  end if;
  insert into public.post_intentos(clave,ip,correcto) values(v_clave,p_ip,true);
  tk:=gen_random_uuid()::text||gen_random_uuid()::text;
  insert into public.post_sesiones(hash,postulante_id,expira_en) values(encode(extensions.digest(tk,'sha256'),'hex'),p.id,now()+interval '8 hours');
  return jsonb_build_object('ok',true,'token',tk,'primer_ingreso',p.primer_ingreso,'expira_en',now()+interval '8 hours');
 end if;
 if p_accion='solicitar' then
  if not c.acceso_abierto then raise exception 'RECEPCIÓN DE POSTULANTES CERRADA'; end if;
  perform pg_advisory_xact_lock(hashtextextended('post-solicitud:'||p_ip,0));
  select count(*) into cant from public.post_intentos where ip=p_ip and clave like 'REG:%' and creado_en>now()-interval '1 hour';
  if cant>=5 then raise exception 'LÍMITE DE SOLICITUDES. CONTACTE A LA ADMINISTRACIÓN'; end if;
  v_ci:=upper(regexp_replace(trim(coalesce(p_datos->>'ci','')),'\s','','g'));
  if v_ci !~ '^[0-9]{4,12}(-[0-9A-Z]{1,4})?$' or length(trim(coalesce(p_datos->>'nombre_completo',''))) not between 5 and 180 or nullif(p_datos->>'foto','') is null then raise exception 'REVISE NOMBRE, CI Y FOTOGRAFÍA'; end if;
  insert into public.post_intentos(clave,ip,correcto) values('REG:'||encode(extensions.digest(v_ci,'sha256'),'hex'),p_ip,true);
  insert into public.post_postulantes(ci,nombre_completo,grado,arma,foto,fuente,password_hash)
   values(v_ci,trim(p_datos->>'nombre_completo'),left(coalesce(p_datos->>'grado',''),60),left(coalesce(p_datos->>'arma',''),60),p_datos->>'foto','SOLICITUD DEL POSTULANTE; PENDIENTE DE COTEJO',extensions.crypt(v_ci,extensions.gen_salt('bf',10)))
   on conflict(convocatoria_id,ci) do nothing returning id into pid;
  if pid is not null then insert into public.post_historial(postulante_id,accion,actor,motivo) values(pid,'SOLICITUD_ALTA','SOLICITANTE','Pendiente de verificación institucional'); end if;
  return jsonb_build_object('ok',true,'mensaje','SOLICITUD RECIBIDA. LA ADMINISTRACIÓN DEBE VERIFICAR SU IDENTIDAD Y HABILITAR EL ACCESO. SI YA EXISTÍA UN EXPEDIENTE, SE CONSERVÓ SIN CAMBIOS.');
 end if;
 if length(coalesce(p_token,'')) not between 20 and 200 then raise exception 'SESIÓN REQUERIDA'; end if;
 select * into ses from public.sesiones where token=p_token;
 if ses.token is not null then
  if ses.revocado is distinct from false or ses.expira_en<=now() or ses.es_master or ses.soporte_actor_id is not null or ses.usuario_tabla<>'profesores' then raise exception 'USÁ TU CUENTA PERSONAL ACTIVA'; end if;
  select * into a from public.profesores where id=ses.usuario_id and profesores.ci=ses.usuario_ci and activo;
  select * into perm from public.post_permisos where profesor_id=a.id;
  if a.id is null or perm.profesor_id is null then raise exception 'SIN PERMISO PARA POSTULANTES'; end if;
  actor:=a.id; es_admin:=true;
 else
  select * into s from public.post_sesiones where hash=encode(extensions.digest(p_token,'sha256'),'hex') and not revocada and expira_en>now();
  if s.hash is null then raise exception 'SESIÓN VENCIDA'; end if;
  select * into p from public.post_postulantes where id=s.postulante_id;
  if p_accion='salir' then
   update public.post_sesiones set revocada=true where hash=s.hash;
   return jsonb_build_object('ok',true);
  end if;
  if not c.acceso_abierto or not p.habilitado then raise exception 'ACCESO DE POSTULANTES CERRADO'; end if;
  actor:='POST:'||p.id::text; pid:=p.id;
  if p_accion='cambiar_clave' then
   tk:=p_datos->>'password';
   if octet_length(tk) not between 10 and 72 or tk=p.ci or extensions.crypt(tk,p.password_hash)=p.password_hash then raise exception 'USE UNA NUEVA CONTRASEÑA DE 10 A 72 BYTES, DIFERENTE DE SU CI'; end if;
   update public.post_postulantes set password_hash=extensions.crypt(tk,extensions.gen_salt('bf',10)),primer_ingreso=false where id=pid;
   update public.post_sesiones set revocada=true where postulante_id=pid and hash<>s.hash;
   insert into public.post_historial(postulante_id,accion,actor,motivo) values(pid,'CAMBIO_CLAVE',actor,'Cambio personal de contraseña');
   return jsonb_build_object('ok',true);
  end if;
  if p.primer_ingreso then return jsonb_build_object('ok',false,'primer_ingreso',true,'error','DEBE CAMBIAR SU CONTRASEÑA ANTES DE CONSULTAR'); end if;
 end if;
 if p_accion='panel' then
  select jsonb_agg(to_jsonb(x) order by orden) into materias from public.post_materias x;
  if es_admin then
   select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'ci',x.ci,'nombre_completo',x.nombre_completo,'grado',x.grado,'habilitado',x.habilitado,'identidad_verificada',x.identidad_verificada,'tiene_foto',x.foto is not null,'revision',x.revision) order by x.nombre_completo),'[]') into filas from public.post_postulantes x where convocatoria_id=2027;
   select coalesce(jsonb_agg(jsonb_build_object('postulante_id',x.postulante_id,'materia',x.materia,'nota',x.nota,'escala',x.escala,'resultado',x.resultado,'publicada',x.publicada)),'[]') into cuerpo from public.post_evaluaciones x;
  else filas:='[]'; end if;
  return jsonb_build_object('ok',true,'admin',es_admin,'actor',actor,'permisos',case when es_admin then to_jsonb(perm) else '{}'::jsonb end,'convocatoria',to_jsonb(c),'materias',materias,'postulantes',filas,'resumen',coalesce(cuerpo,'[]'),'postulante_id',pid);
 end if;
 if p_accion='configurar' then
  if not es_admin or actor not in ('P001','P030') then raise exception 'SOLO COMANDANTE Y ADMINISTRADOR CONFIGURAN LA DIRECTIVA'; end if;
  if (p_datos->>'version')::integer is distinct from c.version then raise exception 'OTRO USUARIO ACTUALIZÓ LA CONVOCATORIA'; end if;
  if length(trim(coalesce(p_datos->>'referencia','')))<10 or coalesce(p_datos->>'sha256','') !~ '^[0-9a-f]{64}$' or p_datos->>'confirmacion'<>'DIRECTIVA REVISADA' then raise exception 'REQUIERE REFERENCIA, HUELLA SHA256 Y REVISIÓN EXPRESA DE LA DIRECTIVA'; end if;
  update public.post_convocatorias set directiva_referencia=p_datos->>'referencia',directiva_sha256=p_datos->>'sha256',directiva_validada=true,version=version+1 where id=2027;
  insert into public.post_historial(accion,actor,motivo,nuevo) values('DIRECTIVA_VALIDADA',actor,p_datos->>'referencia',jsonb_build_object('sha256',p_datos->>'sha256'));
  return jsonb_build_object('ok',true);
 end if;
 if p_accion='acceso' then
  if not es_admin or actor<>'P001' or a.rol is distinct from 'comandante' then raise exception 'SOLO EL COMANDANTE ORDENA CIERRE O REAPERTURA'; end if;
  if (p_datos->>'version')::integer is distinct from c.version or length(trim(coalesce(p_datos->>'motivo','')))<10 or jsonb_typeof(p_datos->'abierto')<>'boolean' then raise exception 'REVISE VERSIÓN, ORDEN Y MOTIVO'; end if;
  update public.post_convocatorias set acceso_abierto=(p_datos->>'abierto')::boolean,cierre_motivo=p_datos->>'motivo',cierre_actor=actor,cierre_en=now(),version=version+1 where id=2027;
  if not (p_datos->>'abierto')::boolean then update public.post_sesiones set revocada=true where not revocada; end if;
  insert into public.post_historial(accion,actor,motivo,nuevo) values('ACCESO_CONVOCATORIA',actor,p_datos->>'motivo',p_datos-'token');
  return jsonb_build_object('ok',true);
 end if;
 if p_accion='guardar_postulante' then
  if not es_admin or not perm.administrar then raise exception 'SIN PERMISO PARA ADMINISTRAR IDENTIDADES'; end if;
  pid:=nullif(p_datos->>'id','')::uuid;
  v_ci:=upper(regexp_replace(trim(coalesce(p_datos->>'ci','')),'\s','','g'));
  if v_ci !~ '^[0-9]{4,12}(-[0-9A-Z]{1,4})?$' or length(trim(coalesce(p_datos->>'nombre_completo',''))) not between 5 and 180 or length(coalesce(p_datos->>'fuente',''))<5 then raise exception 'REVISE NOMBRE, CI Y FUENTE DOCUMENTAL'; end if;
  if length(coalesce(p_datos->>'motivo',''))<5 then raise exception 'INDIQUE EL MOTIVO'; end if;
  if pid is not null then
   select * into p from public.post_postulantes where id=pid for update;
   if p.id is null or (p_datos->>'revision')::integer is distinct from p.revision then raise exception 'EXPEDIENTE ACTUALIZADO POR OTRO USUARIO. RECARGUE'; end if;
   if v_ci<>p.ci then raise exception 'EL CI NO SE CAMBIA. REQUIERE RECTIFICACIÓN CONTROLADA'; end if;
   previo:=(to_jsonb(p)-'password_hash'-'foto')||jsonb_build_object('foto_sha256',encode(extensions.digest(coalesce(p.foto,''),'sha256'),'hex'));
   update public.post_postulantes set nombre_completo=trim(p_datos->>'nombre_completo'),grado=left(coalesce(p_datos->>'grado',''),60),arma=left(coalesce(p_datos->>'arma',''),60),
    foto=coalesce(nullif(p_datos->>'foto',''),foto),filiacion=coalesce(p_datos->'filiacion',filiacion),fuente=p_datos->>'fuente',
    identidad_verificada=coalesce((p_datos->>'identidad_verificada')::boolean,false),habilitado=coalesce((p_datos->>'habilitado')::boolean,false),revision=revision+1 where id=pid;
   if not coalesce((p_datos->>'habilitado')::boolean,false) then update public.post_sesiones set revocada=true where postulante_id=pid; end if;
  else
   insert into public.post_postulantes(ci,nombre_completo,grado,arma,foto,filiacion,fuente,password_hash,identidad_verificada,habilitado)
    values(v_ci,trim(p_datos->>'nombre_completo'),left(coalesce(p_datos->>'grado',''),60),left(coalesce(p_datos->>'arma',''),60),nullif(p_datos->>'foto',''),coalesce(p_datos->'filiacion','{}'),p_datos->>'fuente',extensions.crypt(v_ci,extensions.gen_salt('bf',10)),coalesce((p_datos->>'identidad_verificada')::boolean,false),coalesce((p_datos->>'habilitado')::boolean,false)) returning id into pid;
  end if;
  update public.post_certificados set anulado_en=now(),anulacion_motivo='Identidad rectificada' where postulante_id=pid and anulado_en is null;
  insert into public.post_historial(postulante_id,accion,actor,motivo,anterior,nuevo) values(pid,'IDENTIDAD',actor,p_datos->>'motivo',previo,(p_datos-'foto'-'password')||jsonb_build_object('foto_sha256',case when p_datos->>'foto' is not null then encode(extensions.digest(p_datos->>'foto','sha256'),'hex') else null end));
  return jsonb_build_object('ok',true,'id',pid);
 end if;
 if es_admin then pid:=nullif(p_datos->>'postulante_id','')::uuid; end if;
 if pid is null then raise exception 'SELECCIONE UN POSTULANTE'; end if;
 select * into p from public.post_postulantes where id=pid for update;
 if p.id is null then raise exception 'POSTULANTE NO ENCONTRADO'; end if;
 if p_accion in ('expediente','vista_postulante') then
  if p_accion='vista_postulante' then
   if not es_admin or actor<>'P030' or length(trim(coalesce(p_datos->>'motivo','')))<5 then raise exception 'SOPORTE PERSONAL Y MOTIVO REQUERIDOS'; end if;
   insert into public.post_historial(postulante_id,accion,actor,motivo) values(pid,'CONSULTA_COMO_POSTULANTE',actor,p_datos->>'motivo');
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by materia),'[]') into filas from public.post_evaluaciones x where postulante_id=pid and (es_admin and p_accion<>'vista_postulante' or publicada);
  select coalesce(jsonb_agg(to_jsonb(x) order by creado_en desc),'[]') into hist from (select ph.id,ph.accion,ph.actor,ph.motivo,ph.anterior,ph.nuevo,ph.creado_en from public.post_historial ph where ph.postulante_id=pid and es_admin and p_accion<>'vista_postulante' order by id desc limit 200) x;
  select coalesce(jsonb_agg(to_jsonb(x) order by emitido_en desc),'[]') into certs from (select id,tipo,emitido_en,anulado_en,pdf_sha256 from public.post_certificados where postulante_id=pid and pdf_sha256 is not null) x;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into cuerpo from public.post_conformidades x where postulante_id=pid;
  return jsonb_build_object('ok',true,'postulante',to_jsonb(p)-'password_hash','evaluaciones',filas,'historial',hist,'certificados',certs,'conformidades',cuerpo,'solo_lectura',not es_admin or p_accion='vista_postulante');
 end if;
 if p_accion='confirmar' then
  if es_admin then raise exception 'LA CONFORMIDAD SOLO LA DA EL POSTULANTE DESDE SU CUENTA'; end if;
  select * into e from public.post_evaluaciones where id=(p_datos->>'evaluacion_id')::uuid and postulante_id=pid and publicada for share;
  if e.id is null or e.revision is distinct from (p_datos->>'revision')::integer then raise exception 'LA EVALUACIÓN CAMBIÓ. REVISE LA VERSIÓN ACTUAL'; end if;
  insert into public.post_conformidades(evaluacion_id,revision,postulante_id) values(e.id,e.revision,pid) on conflict do nothing;
  return jsonb_build_object('ok',true);
 end if;
 if p_accion='evaluar' then
  select * into m from public.post_materias where codigo=p_datos->>'materia';
  if not es_admin or m.codigo is null or not (case when m.tipo='FISICA' then perm.fisica else perm.academicas end) then raise exception 'SIN PERMISO PARA ESA EVALUACIÓN'; end if;
  if not p.identidad_verificada then raise exception 'VERIFIQUE LA IDENTIDAD ANTES DE CALIFICAR'; end if;
  if length(trim(coalesce(p_datos->>'referencia','')))<5 or length(trim(coalesce(p_datos->>'motivo','')))<5 then raise exception 'INDIQUE ACTA DE RESPALDO Y MOTIVO'; end if;
  if m.tipo='ACADEMICA' and p_datos->>'resultado' not in ('PENDIENTE','AUSENTE') and (nullif(p_datos->>'nota','') is null or nullif(p_datos->>'escala','') is null) then raise exception 'LA EVALUACIÓN ACADÉMICA REQUIERE NOTA Y ESCALA DEL ACTA'; end if;
  if m.tipo='FISICA' and p_datos->>'resultado' not in ('PENDIENTE','AUSENTE') and jsonb_array_length(coalesce(p_datos->'detalle'->'pruebas','[]'))=0 then raise exception 'REGISTRE LAS PRUEBAS FÍSICAS Y SUS MARCAS'; end if;
  select * into e from public.post_evaluaciones where postulante_id=pid and materia=m.codigo for update;
  if coalesce(e.revision,0) is distinct from (p_datos->>'revision')::integer then raise exception 'OTRO EVALUADOR CAMBIÓ ESTA NOTA. RECARGUE'; end if;
  previo:=case when e.id is null then null else to_jsonb(e) end; rev:=coalesce(e.revision,0)+1;
  insert into public.post_evaluaciones(postulante_id,materia,nota,escala,resultado,detalle,observacion,referencia,publicada,revision,actor)
   values(pid,m.codigo,nullif(p_datos->>'nota','')::numeric,nullif(p_datos->>'escala','')::numeric,p_datos->>'resultado',coalesce(p_datos->'detalle','{}'),left(coalesce(p_datos->>'observacion',''),2000),p_datos->>'referencia',coalesce((p_datos->>'publicada')::boolean,false),rev,actor)
   on conflict(postulante_id,materia) do update set nota=excluded.nota,escala=excluded.escala,resultado=excluded.resultado,detalle=excluded.detalle,observacion=excluded.observacion,referencia=excluded.referencia,publicada=excluded.publicada,revision=excluded.revision,actor=excluded.actor,registrada_en=now();
  select to_jsonb(x) into nuevo from public.post_evaluaciones x where postulante_id=pid and materia=m.codigo;
  insert into public.post_historial(postulante_id,accion,actor,motivo,anterior,nuevo) values(pid,'EVALUACION',actor,p_datos->>'motivo',previo,nuevo);
  -- Una corrección deja constancia: documentos anteriores pierden vigencia.
  update public.post_certificados set anulado_en=now(),anulacion_motivo='Evaluación rectificada o actualizada' where postulante_id=pid and anulado_en is null;
  return jsonb_build_object('ok',true,'revision',rev);
 end if;
 if p_accion='emitir' then
  if not es_admin or not perm.certificar then raise exception 'SIN PERMISO PARA EMITIR DOCUMENTOS'; end if;
  if not p.identidad_verificada or p.foto is null then raise exception 'FALTAN IDENTIDAD VERIFICADA Y FOTOGRAFÍA'; end if;
  if p_datos->>'tipo' not in ('REGISTRO_PARCIAL','CERTIFICADO') then raise exception 'TIPO DE DOCUMENTO NO VÁLIDO'; end if;
  if p_datos->>'tipo'='CERTIFICADO' and (not c.directiva_validada or (select count(*) from public.post_evaluaciones where postulante_id=pid and publicada and resultado not in ('PENDIENTE','AUSENTE'))<>9) then raise exception 'CERTIFICADO FINAL: REQUIERE DIRECTIVA REVISADA Y LAS NUEVE EVALUACIONES PUBLICADAS Y COMPLETAS'; end if;
  select jsonb_agg(jsonb_build_object('codigo',x.codigo,'nombre',x.nombre,'inicio',x.inicio,'fin',x.fin,'evaluacion',case when ev.id is not null then to_jsonb(ev)||jsonb_build_object('evaluador_nombre',pr.nombre_completo,'evaluador_grado',pr.grado,'conformidad_en',cf.creado_en) else null end) order by x.orden) into filas
   from public.post_materias x left join public.post_evaluaciones ev on ev.materia=x.codigo and ev.postulante_id=pid and ev.publicada
   left join public.profesores pr on pr.id=ev.actor left join public.post_conformidades cf on cf.evaluacion_id=ev.id and cf.revision=ev.revision;
  cuerpo:=jsonb_build_object('gestion',2027,'nombre_completo',p.nombre_completo,'ci',p.ci,'grado',p.grado,'arma',p.arma,'foto',p.foto,'filiacion',p.filiacion,'evaluaciones',filas,'directiva_referencia',c.directiva_referencia,'directiva_validada',c.directiva_validada,'emisor_nombre',a.nombre_completo,'emisor_grado',a.grado);
  insert into public.post_certificados(postulante_id,tipo,contenido,contenido_sha256,emisor) values(pid,p_datos->>'tipo',cuerpo,encode(extensions.digest(cuerpo::text,'sha256'),'hex'),actor) returning * into cert;
  insert into public.post_historial(postulante_id,accion,actor,motivo,nuevo) values(pid,'DOCUMENTO_EMITIDO',actor,'Registro inmutable con QR',jsonb_build_object('id',cert.id,'tipo',cert.tipo));
  return jsonb_build_object('ok',true,'documento',to_jsonb(cert)-'pdf_base64');
 end if;
 if p_accion='descargar' then
  select * into cert from public.post_certificados where id=(p_datos->>'id')::uuid and postulante_id=pid;
  if cert.id is null or cert.pdf_sha256 is null then raise exception 'DOCUMENTO NO DISPONIBLE'; end if;
  return jsonb_build_object('ok',true,'pdf_base64',cert.pdf_base64,'pdf_sha256',cert.pdf_sha256,'id',cert.id,'anulado',cert.anulado_en is not null);
 end if;
 raise exception 'ACCIÓN NO PERMITIDA';
end $$;
revoke all on function public.post_operar(text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.post_operar(text,text,jsonb,text) to service_role;

-- Solo el servidor sella el PDF, sin endpoint de cliente para esta operación.
create function public.post_sellar(p_id uuid,p_pdf text,p_sha256 text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if length(p_pdf)>12000000 or encode(extensions.digest(decode(p_pdf,'base64'),'sha256'),'hex')<>p_sha256 then raise exception 'HUELLA PDF INCORRECTA'; end if;
 update public.post_certificados set pdf_base64=p_pdf,pdf_sha256=p_sha256 where id=p_id and pdf_sha256 is null and anulado_en is null;
 return found;
end $$;
revoke all on function public.post_sellar(uuid,text,text) from public,anon,authenticated;
grant execute on function public.post_sellar(uuid,text,text) to service_role;
