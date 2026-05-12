alter table public.atendidos enable row level security;

drop policy if exists "view_atendidos" on public.atendidos;
create policy "view_atendidos"
on public.atendidos
for select
to authenticated
using (true);

drop policy if exists "ins_atendidos" on public.atendidos;
create policy "ins_atendidos"
on public.atendidos
for insert
to authenticated
with check (public.can_edit(auth.uid()));

drop policy if exists "upd_atendidos" on public.atendidos;
create policy "upd_atendidos"
on public.atendidos
for update
to authenticated
using (public.can_edit(auth.uid()));

drop policy if exists "del_atendidos" on public.atendidos;
create policy "del_atendidos"
on public.atendidos
for delete
to authenticated
using (public.has_role(auth.uid(), 'administrador'));
