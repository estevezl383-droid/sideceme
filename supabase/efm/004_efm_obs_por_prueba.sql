-- Observación por prueba EFM (la Sub. Sec. de Entrenamiento Físico la escribe
-- junto a cada nota y el cursante la ve antes de dar su conformidad).
alter table public.evaluaciones_fisicas
  add column if not exists talla_peso_obs   text,
  add column if not exists natacion_obs     text,
  add column if not exists abdominales_obs  text,
  add column if not exists flexiones_obs    text,
  add column if not exists barra_obs        text,
  add column if not exists aerobica_obs     text;
