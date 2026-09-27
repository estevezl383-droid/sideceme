-- ================================================================================
-- SIDECEME — Seguridad 005: tablas que la app no usa con la clave pública
-- Aplicada el 2026-09-27 como migración "tablas_sin_uso_publico".
--
-- El aula virtual va por la función aula-virtual-ops, y auditoria /
-- auditoria_consultas_notas las escriben las funciones Edge y los triggers. La app
-- no lee ni escribe estas tablas directo: verificado en el código y en los
-- registros de Supabase del 19 al 27 de septiembre de 2026.
-- ================================================================================

revoke all on
  public.auditoria, public.auditoria_consultas_notas, public.materia_aula_profesores,
  public.av_adjuntos, public.av_carpeta_docentes, public.av_carpetas, public.av_cronograma,
  public.av_elementos, public.av_evaluaciones, public.av_informe, public.av_materias,
  public.av_tareas, public.av_trabajos, public.av_profesor_materia
from anon;

drop policy if exists anon_insert on public.auditoria;
drop policy if exists anon_insert on public.auditoria_consultas_notas;
drop policy if exists anon_select on public.auditoria_consultas_notas;
drop policy if exists anon_select on public.materia_aula_profesores;
drop policy if exists av_adjuntos_read on public.av_adjuntos;
drop policy if exists av_carpeta_docentes_read on public.av_carpeta_docentes;
drop policy if exists av_carpetas_read on public.av_carpetas;
drop policy if exists av_cronograma_read on public.av_cronograma;
drop policy if exists av_elementos_read on public.av_elementos;
drop policy if exists av_evaluaciones_read on public.av_evaluaciones;
drop policy if exists av_informe_read on public.av_informe;
drop policy if exists av_materias_read on public.av_materias;
drop policy if exists av_tareas_read on public.av_tareas;
