-- Bloquea nuevas firmas sobre publicaciones sin nota vigente.
-- No modifica notas ni firmas historicas.
CREATE OR REPLACE FUNCTION public.validar_conformidad_nota_vigente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nota numeric;
BEGIN
  IF NEW.estado IN ('confirmada', 'rechazada') AND OLD.estado = 'pendiente' THEN
    IF NEW.publicado_en IS NULL THEN
      RAISE EXCEPTION 'La conformidad no esta publicada' USING ERRCODE = '23514';
    END IF;
    BEGIN
      SELECT n.nota_final INTO STRICT v_nota
      FROM public.notas_academicas n
      WHERE n.cursante_id = NEW.cursante_id
        AND n.gestion = NEW.gestion AND n.semestre = NEW.semestre
        AND n.ciclo = NEW.ciclo AND n.materia = NEW.materia
      FOR SHARE;
    EXCEPTION
      WHEN no_data_found OR too_many_rows THEN
        RAISE EXCEPTION 'La publicacion no corresponde a una nota vigente unica' USING ERRCODE = '23514';
    END;
    IF v_nota IS NULL OR NEW.nota_final IS NULL
      OR round(v_nota, 4) IS DISTINCT FROM round(NEW.nota_final, 4) THEN
      RAISE EXCEPTION 'La nota publicada difiere de la nota vigente' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validar_conformidad_nota_vigente() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validar_conformidad_nota_vigente() TO service_role;
DROP TRIGGER IF EXISTS trg_conformidad_nota_vigente ON public.notas_confirmaciones;
CREATE TRIGGER trg_conformidad_nota_vigente
BEFORE UPDATE OF estado ON public.notas_confirmaciones
FOR EACH ROW EXECUTE FUNCTION public.validar_conformidad_nota_vigente();