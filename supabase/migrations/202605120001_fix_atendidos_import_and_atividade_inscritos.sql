-- Correcoes seguras para importacao de atendidos e vinculos de inscritos.
-- Mantem dados existentes e falha explicitamente se houver duplicidades que precisam ser revisadas.

alter table public.atendidos
  add column if not exists id_externo text;

-- ON CONFLICT (id_externo) precisa de uma restricao unica/indice unico inferivel.
do $$
begin
  if exists (
    select 1
    from public.atendidos
    where id_externo is not null and btrim(id_externo) <> ''
    group by id_externo
    having count(*) > 1
  ) then
    raise exception 'Nao foi possivel criar unicidade em atendidos.id_externo: existem IDs externos duplicados.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'atendidos_id_externo_key'
      and conrelid = 'public.atendidos'::regclass
  ) then
    alter table public.atendidos
      add constraint atendidos_id_externo_key unique (id_externo);
  end if;
end $$;

create table if not exists public.atividade_inscritos (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades(id) on delete cascade,
  atendido_id uuid not null references public.atendidos(id) on delete cascade,
  status text not null default 'inscrito',
  data_inscricao date not null default current_date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint atividade_inscritos_status_check check (status in ('inscrito', 'espera', 'removido'))
);

alter table public.atividade_inscritos
  add column if not exists observacoes text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'atividade_inscritos_status_check'
      and conrelid = 'public.atividade_inscritos'::regclass
  ) then
    alter table public.atividade_inscritos
      add constraint atividade_inscritos_status_check
      check (status in ('inscrito', 'espera', 'removido'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'atividade_inscritos_atividade_atendido_key'
      and conrelid = 'public.atividade_inscritos'::regclass
  ) then
    alter table public.atividade_inscritos
      add constraint atividade_inscritos_atividade_atendido_key unique (atividade_id, atendido_id);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_atividade_inscritos_updated_at on public.atividade_inscritos;
create trigger set_atividade_inscritos_updated_at
before update on public.atividade_inscritos
for each row execute function public.set_updated_at();
