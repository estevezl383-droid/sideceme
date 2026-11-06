-- Permite conservar sin recortar ni recomprimir los retratos originales recibidos.
alter table public.post_postulantes drop constraint post_postulantes_foto_check;
alter table public.post_postulantes add constraint post_postulantes_foto_check
 check(foto is null or (length(foto)<=6000000 and foto ~ '^data:image/(jpeg|png);base64,'));
