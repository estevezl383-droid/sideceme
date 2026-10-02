-- ============================================================================
-- Carga por MÓDULO: confirmación de las notas de materias ya reconocidas
-- y publicación del promedio del módulo tal cual lo trae la planilla.
--
-- Solo CREA tablas nuevas. No modifica notas_academicas, notas_confirmaciones
-- ni ninguna firma existente. Acceso únicamente vía Edge Function notas-modulo
-- (service_role); anon/authenticated no tienen permisos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notas_modulos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestion       integer  NOT NULL,
  semestre      smallint NOT NULL CHECK (semestre IN (1, 2)),
  ciclo         text     NOT NULL,
  modulo        text     NOT NULL,
  -- [{columna:"HISTORIA MILITAR  1", materia:"HISTORIA MILITAR APLICADA I"}, ...]
  materias      jsonb    NOT NULL,
  archivo       text,
  hoja          text,
  cargado_por   text,
  cargado_por_id text,
  resumen       jsonb,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gestion, semestre, ciclo, modulo)
);

-- Una fila por alumno y módulo. `promedio` es EXACTAMENTE el de la planilla.
-- estado: retenida (no coincide / falta reconocimiento: NO se publica)
--         pendiente (publicada, esperando firma) · confirmada · rechazada
CREATE TABLE IF NOT EXISTS public.notas_modulo_alumnos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id     uuid NOT NULL REFERENCES public.notas_modulos(id),
  cursante_id   text NOT NULL,
  ci            text,
  gestion       integer  NOT NULL,
  semestre      smallint NOT NULL,
  ciclo         text     NOT NULL,
  modulo        text     NOT NULL,
  promedio      numeric  NOT NULL,
  atributo      text,
  -- [{materia, excel, sistema, estado_conformidad, coincide}]
  notas         jsonb NOT NULL,
  estado        text NOT NULL DEFAULT 'retenida'
                CHECK (estado IN ('retenida', 'pendiente', 'confirmada', 'rechazada')),
  motivo_retencion text,
  publicado_en  timestamptz,
  plazo_vence_en timestamptz,
  firma_cursante text,
  confirmada_en timestamptz,
  observacion_cursante text,
  huella_forense jsonb,
  anterior      jsonb,           -- foto de la versión previa si una recarga la cambió
  creado_en     timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cursante_id, gestion, semestre, ciclo, modulo)
);
CREATE INDEX IF NOT EXISTS notas_modulo_alumnos_modulo_idx ON public.notas_modulo_alumnos (modulo_id);

-- Alarma: una nota de la planilla del módulo no coincide con la ya cargada,
-- falta la nota de la materia, o el alumno no la reconoció (objeción/sin firma).
CREATE TABLE IF NOT EXISTS public.notas_modulo_alarmas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id     uuid REFERENCES public.notas_modulos(id),
  gestion       integer  NOT NULL,
  semestre      smallint NOT NULL,
  ciclo         text     NOT NULL,
  modulo        text     NOT NULL,
  cursante_id   text NOT NULL,
  nombre        text,
  materia       text,
  tipo          text NOT NULL CHECK (tipo IN ('no_coincide', 'sin_nota', 'objetada', 'sin_firma', 'cambio_al_firmar')),
  nota_excel    text,
  nota_sistema  text,
  detalle       text,
  detectado_por text,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  atendida_en   timestamptz,
  atendida_por  text,
  atendida_comentario text
);
CREATE INDEX IF NOT EXISTS notas_modulo_alarmas_abiertas_idx
  ON public.notas_modulo_alarmas (ciclo) WHERE atendida_en IS NULL;

ALTER TABLE public.notas_modulos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_modulo_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_modulo_alarmas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notas_modulos, public.notas_modulo_alumnos, public.notas_modulo_alarmas FROM anon, authenticated;
GRANT ALL ON public.notas_modulos, public.notas_modulo_alumnos, public.notas_modulo_alarmas TO service_role;
