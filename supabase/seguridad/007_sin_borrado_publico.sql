-- ================================================================================
-- SIDECEME — Seguridad 007: horarios, planillas y cargos sin borrado público
-- Aplicada el 2026-09-27 como migración "b2_sin_borrado_publico".
--
-- La app nunca borra físicamente horarios_semanales, planillas_disciplina ni
-- seccion_cargos: los marca inactivos o concluidos. Con la clave pública se podían
-- borrar todas las filas; se quitan DELETE y TRUNCATE.
-- ================================================================================
revoke delete, truncate on public.horarios_semanales, public.planillas_disciplina, public.seccion_cargos from anon;
