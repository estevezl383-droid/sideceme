-- Aplicar cuando esté publicado el frontend que usa registros-ops para subir.
BEGIN;
SET LOCAL lock_timeout = '3s';
REVOKE INSERT, UPDATE, DELETE ON public.horarios_semanales, public.planillas_disciplina FROM anon;
COMMIT;
