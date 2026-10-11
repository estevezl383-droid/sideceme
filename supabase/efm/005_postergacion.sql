-- Ejecutar antes de desplegar efm-ops y el frontend. No cambia notas ni firmas.
BEGIN;
ALTER TABLE public.efm_confirmaciones ADD COLUMN IF NOT EXISTS postergacion jsonb;
ALTER TABLE public.efm_confirmaciones DROP CONSTRAINT IF EXISTS efm_confirmaciones_estado_ck;
ALTER TABLE public.efm_confirmaciones ADD CONSTRAINT efm_confirmaciones_estado_ck
  CHECK (estado IN ('pendiente','confirmada','rechazada','postergada'));
-- El historial se escribe en la misma transacción que el cambio de estado.
CREATE OR REPLACE FUNCTION public.efm_auditar_postergacion() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado AND (OLD.estado='postergada' OR NEW.estado='postergada') THEN
    INSERT INTO public.efm_correcciones (efm_id,cursante_id,origen,antes,despues,motivo,por_id,por_nombre)
    VALUES (NEW.efm_id,NEW.cursante_id,'postergacion',
      jsonb_build_object('estado',OLD.estado,'postergacion',OLD.postergacion,'observacion_cursante',OLD.observacion_cursante,'firma_cursante',OLD.firma_cursante,'confirmada_en',OLD.confirmada_en),
      jsonb_build_object('estado',NEW.estado,'postergacion',NEW.postergacion),
      NEW.postergacion->>'motivo',
      COALESCE(NEW.postergacion->>'cerrada_por',NEW.postergacion->>'por_id'),
      COALESCE(NEW.postergacion->>'cerrada_por_nombre',NEW.postergacion->>'por_nombre'));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.efm_auditar_postergacion() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS efm_postergacion_audit ON public.efm_confirmaciones;
CREATE TRIGGER efm_postergacion_audit AFTER UPDATE ON public.efm_confirmaciones
  FOR EACH ROW EXECUTE FUNCTION public.efm_auditar_postergacion();
COMMIT;
