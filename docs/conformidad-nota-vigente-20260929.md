# Conformidad de la nota vigente — 29/09/2026

## Incidente y causa
Las publicaciones de conformidad se consultaban sin comprobar si existia su nota en notas_academicas. Tras reemplazar una carga con otro nombre de materia, permanecian pendientes de la publicacion anterior y el aviso del inicio abria esas notas historicas. La firma no recalculaba la nota academica.

Se detectaron 99 publicaciones historicas de Menciones en el segundo ciclo, semestre relativo 2, gestion 2026. La carga vigente usa UC. Menciones. No se modifican notas, firmas, estados, fechas ni observaciones existentes y no se trasladan firmas entre publicaciones.

## Correccion
- notas-confirmar devuelve solamente publicaciones con nota academica vigente del mismo cursante, gestion, semestre, ciclo y nombre exacto de materia, y con el mismo valor presentado a cuatro decimales.
- consultar revalida la publicacion antes de abrir el canvas.
- resolver comprueba vigencia, nota mostrada y publicacion; verifica que realmente se actualizo una fila y conserva nota, materia y publicacion en la huella de nuevas firmas.
- El trigger valida la transicion de pendiente a confirmada/rechazada y bloquea cambios concurrentes de la nota durante la firma con FOR SHARE.
- El navegador cierra el canvas anterior, consulta al servidor antes de abrir la firma y rechaza respuestas de solicitudes anteriores.
- Las publicaciones historicas permanecen en notas_confirmaciones para auditoria y consulta del evaluador.

## Validacion
node tests/conformidad-nota-vigente.cjs (Node 24)
Pruebas de API con base simulada: publicaciones vigentes/obsoletas, lectura nueva, valores/publicaciones cambiados, respuesta duplicada, carrera, proteccion de DB y sesion invalida.
Pruebas de navegador: valor vigente del servidor y rechazo de cache antigua.
Prueba en base real dentro de BEGIN/ROLLBACK: publicacion obsoleta bloqueada y vigente permitida. Sin firmas ni cambios persistentes de datos.
Consulta final: 99 publicaciones historicas excluidas, 1146 conformidades vigentes y cero diferencias de nota a cuatro decimales.

## Despliegue
Aplicar supabase/notas/001_conformidad_nota_vigente.sql.
Desplegar supabase/functions/notas-confirmar/index.ts con JWT OFF, preservando validacion propia de sesiones y pertenencia al cursante.
Publicar index.html en el alojamiento actual. Recargar el navegador para usar la lectura nueva antes del canvas.
La proteccion del servidor tambien rechaza publicaciones obsoletas de clientes antiguos.

## Reversion
El frontend anterior se conserva en el padre del commit y la Edge Function anterior en supabase/notas-confirmar/rollback-v3.ts. El trigger puede retirarse con DROP TRIGGER trg_conformidad_nota_vigente ON public.notas_confirmaciones. No se necesita restaurar notas ni firmas, porque no se cambiaron.

## Aviso por publicacion para ambos ciclos
El aviso enumera cada nota pendiente con materia, ciclo, semestre, gestion y nota. Cada boton conserva el ID de esa publicacion y abre su consulta vigente antes del canvas. Firmadas y objetadas no aparecen como pendientes. Se probaron ambos ciclos y ambos semestres, destino individual de varios pendientes, retiro al responder y continuidad de EFM. Las cargas historicas sin publicacion no se publicaron automaticamente.
