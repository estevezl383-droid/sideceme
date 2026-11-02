begin;
create table public.efmc_documentos (
 id uuid primary key,
 organizacion_id uuid not null references public.efmc_organizaciones(id),
 cursante_id text not null references public.cursantes(id),
 snapshot jsonb not null,
 fingerprint text not null check(fingerprint ~ '^[0-9a-f]{64}$'),
 pdf_sha256 text not null check(pdf_sha256 ~ '^[0-9a-f]{64}$'),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 storage_path text not null unique,
 emitido_en timestamptz not null,
 unique(organizacion_id,cursante_id,fingerprint)
);
create index efmc_documentos_cursante on public.efmc_documentos(cursante_id,emitido_en desc);
alter table public.efmc_documentos enable row level security;
revoke all on public.efmc_documentos from public,anon,authenticated;
grant select,insert on public.efmc_documentos to service_role;
create trigger efmc_documentos_inmutables before update or delete on public.efmc_documentos for each row execute function public.efmc_impedir_cambio_historico();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('efm-documentos','efm-documentos',false,2097152,array['application/pdf']);
commit;
