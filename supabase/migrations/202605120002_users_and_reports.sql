alter table public.profiles
  add column if not exists telefone text,
  add column if not exists status text not null default 'ativo',
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
set status = case when ativo then 'ativo' else 'inativo' end
where status is null;

alter table public.profiles
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_status_check check (status in ('ativo', 'inativo'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.relatorios_emitidos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  entidade_tipo text not null,
  entidade_id uuid not null,
  mes int,
  ano int,
  periodo_inicio date,
  periodo_fim date,
  titulo text,
  arquivo_url text,
  usuario_id uuid references auth.users(id) on delete set null,
  parametros_json jsonb,
  created_at timestamptz not null default now(),
  constraint relatorios_emitidos_tipo_check check (tipo in ('relatorio_monitoramento_projeto')),
  constraint relatorios_emitidos_entidade_tipo_check check (entidade_tipo in ('projeto'))
);

alter table public.relatorios_emitidos enable row level security;

drop policy if exists view_relatorios_emitidos on public.relatorios_emitidos;
create policy view_relatorios_emitidos on public.relatorios_emitidos
for select to authenticated using (true);

drop policy if exists insert_relatorios_emitidos on public.relatorios_emitidos;
create policy insert_relatorios_emitidos on public.relatorios_emitidos
for insert to authenticated with check (public.can_edit(auth.uid()));

create index if not exists idx_relatorios_emitidos_entidade
  on public.relatorios_emitidos(entidade_tipo, entidade_id, created_at desc);
