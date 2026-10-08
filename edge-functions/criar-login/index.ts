-- ==========================================================
-- Políticas de RLS do projeto (se quiser separar do schema)
-- ==========================================================

alter table public.igrejas enable row level security;
alter table public.filiais enable row level security;
alter table public.membros enable row level security;
alter table public.perfis enable row level security;
alter table public.grupos enable row level security;
alter table public.membros_grupos enable row level security;
alter table public.eventos enable row level security;
alter table public.escalas enable row level security;
alter table public.lancamentos enable row level security;
alter table public.convites enable row level security;

-- admin: tudo
create policy "admin_all_igrejas"
on public.igrejas
for all
to authenticated
using (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
)
with check (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
);

create policy "admin_all_filiais"
on public.filiais
for all
to authenticated
using (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
)
with check (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
);

create policy "admin_all_perfis"
on public.perfis
for all
to authenticated
using (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
)
with check (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
);

create policy "admin_all_membros"
on public.membros
for all
to authenticated
using (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
)
with check (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
);

create policy "admin_all_convites"
on public.convites
for all
to authenticated
using (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
)
with check (
  exists (select 1 from public.perfis p where p.id = auth.uid() and p.papel = 'admin')
);

-- master: própria igreja
create policy "master_igreja_select"
on public.igrejas
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = igrejas.id
  )
);

create policy "master_filias_proprias"
on public.filiais
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = filiais.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = filiais.igreja_id
  )
);

create policy "master_perfis_proprios"
on public.perfis
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = perfis.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = perfis.igreja_id
  )
);

create policy "master_membros_proprios"
on public.membros
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = membros.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = membros.igreja_id
  )
);

create policy "master_convites_proprios"
on public.convites
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = convites.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = convites.igreja_id
  )
);

-- filial: sua filial
create policy "filial_own_filial"
on public.filiais
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = filiais.id
  )
);

create policy "filial_own_members"
on public.membros
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = membros.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = membros.filial_id
  )
);

create policy "filial_own_perfis"
on public.perfis
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = perfis.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = perfis.filial_id
  )
);

-- membros: só seu próprio cadastro
create policy "membro_own_record"
on public.membros
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'membro' and p.membro_id = membros.id
  )
);

create policy "user_own_profile"
on public.perfis
for select
to authenticated
using (perfis.id = auth.uid());

create policy "user_update_own_profile"
on public.perfis
for update
to authenticated
using (perfis.id = auth.uid())
with check (perfis.id = auth.uid());

