-- ================================================================================
-- GENERADOR DE CALCOS — regla de acceso «ciclo + paralelo» (un curso exacto)
--
-- POR QUÉ: la clase se da por paralelo, pero la regla `paralelo` compara solo la
-- letra: «A» habilitaba el A del 1er ciclo Y el A del 2do (42 + 33). Para un
-- curso exacto había que cargar una regla `persona` por alumno, y esa lista se
-- queda vieja apenas cambia el curso (altas, bajas, el año siguiente).
--
-- La regla nueva guarda `valor` = 'CICLO|PARALELO' (p. ej. '1ER CICLO|A') y entra
-- quien esté HOY en ese curso, sean 42 o 50.
--
-- 100% ADITIVO: solo amplía la lista de tipos permitidos. Las reglas existentes
-- no cambian.
-- ================================================================================

alter table public.calcos_acceso drop constraint if exists calcos_acceso_tipo_check;
alter table public.calcos_acceso add constraint calcos_acceso_tipo_check
  check (tipo = any (array['todos', 'profesores', 'ciclo', 'paralelo', 'ciclo_paralelo', 'mencion', 'persona']));
