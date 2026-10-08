-- ==========================================================
-- Schema principal para Gestão de Membros
-- ==========================================================

create extension if not exists pgcrypto;

create type public.papel as enum ('admin', 'master', 'filial', 'membro');
create type public.situacao_membro as enum ('ativo', 'inativo', 'visitante', 'sem_atividade');

-- igrejas
create table if not exists public.igrejas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  presidente text,
  vice_presidente text,
  telefone text,
  cnpj text,
  endereco text,
  qtd_membros integer default 0 check (qtd_membros >= 0),
  logo_url text,
  cadastro_completo boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- filiais
create table if not exists public.filiais (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  nome text not null,
  responsavel text,
  contato text,
  is_sede boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- membros
create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  filial_id uuid not null references public.filiais(id) on delete restrict,
  nome text not null,
  telefone text,
  email text,
  data_nascimento date,
  endereco text,
  estado_civil text,
  data_batismo date,
  data_entrada date,
  situacao public.situacao_membro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- perfis
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  igreja_id uuid references public.igrejas(id) on delete set null,
  filial_id uuid references public.filiais(id) on delete set null,
  membro_id uuid references public.membros(id) on delete set null,
  nome text not null,
  email text not null,
  papel public.papel not null default 'membro',
  telefone text,
  ativo boolean not null default true,
  trocar_senha boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- grupos
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  filial_id uuid not null references public.filiais(id) on delete cascade,
  nome text not null,
  dia_horario text,
  lider_id uuid references public.membros(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membros_grupos (
  membro_id uuid not null references public.membros(id) on delete cascade,
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  primary key (membro_id, grupo_id)
);

-- eventos
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  filial_id uuid references public.filiais(id) on delete set null,
  titulo text not null,
  tipo text,
  inicio timestamptz not null,
  fim timestamptz,
  local text,
  descricao text,
  recorrencia text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- escalas
create table if not exists public.escalas (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  funcao text not null,
  membro_id uuid not null references public.membros(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- lancamentos contábeis
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  filial_id uuid not null references public.filiais(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'despesa', 'saida')),
  categoria text,
  descricao text,
  valor numeric not null check (valor >= 0),
  data date not null,
  vencimento date,
  situacao text check (situacao in ('a_pagar', 'pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- convites para cadastro público
create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  igreja_id uuid not null references public.igrejas(id) on delete cascade,
  filial_id uuid not null references public.filiais(id) on delete cascade,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  ativo boolean not null default true,
  usado boolean not null default false,
  usado_em timestamptz
);

create index if not exists idx_igrejas_ativo on public.igrejas(ativo);
create index if not exists idx_filiais_igreja on public.filiais(igreja_id);
create index if not exists idx_membros_igreja on public.membros(igreja_id);
create index if not exists idx_membros_filial on public.membros(filial_id);
create index if not exists idx_perfis_igreja on public.perfis(igreja_id);
create index if not exists idx_perfis_filial on public.perfis(filial_id);
create index if not exists idx_perfis_papel on public.perfis(papel);
create index if not exists idx_convites_token on public.convites(token);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_set_updated_at_igrejas
before update on public.igrejas
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_filiais
before update on public.filiais
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_membros
before update on public.membros
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_perfis
before update on public.perfis
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_grupos
before update on public.grupos
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_eventos
before update on public.eventos
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_escalas
before update on public.escalas
for each row execute function public.set_updated_at();

create or replace trigger trg_set_updated_at_lancamentos
before update on public.lancamentos
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (
    id,
    igreja_id,
    filial_id,
    membro_id,
    nome,
    email,
    papel,
    telefone,
    ativo,
    trocar_senha
  ) values (
    new.id,
    null,
    null,
    null,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'membro',
    new.raw_user_meta_data->>'telefone',
    true,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

create policy "admin_all_igrejas"
on public.igrejas
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_select_igreja"
on public.igrejas
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = igrejas.id
  )
);

create policy "master_update_igreja"
on public.igrejas
for update
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = igrejas.id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = igrejas.id
  )
);

create policy "user_select_own_profile_igreja"
on public.igrejas
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.igreja_id = igrejas.id
  )
);

create policy "admin_all_filiais"
on public.filiais
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_filiais"
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

create policy "filial_select_own_filial"
on public.filiais
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = filiais.id
  )
);

create policy "filial_update_own_filial"
on public.filiais
for update
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = filiais.id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = filiais.id
  )
);

create policy "admin_all_perfis"
on public.perfis
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_manage_own_igreja_perfis"
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

create policy "filial_manage_own_filial_perfis"
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

create policy "user_select_own_perfil"
on public.perfis
for select
to authenticated
using (perfis.id = auth.uid());

create policy "user_update_own_perfil"
on public.perfis
for update
to authenticated
using (perfis.id = auth.uid())
with check (perfis.id = auth.uid());

create policy "admin_all_membros"
on public.membros
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_manage_own_igreja_membros"
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

create policy "filial_manage_own_filial_membros"
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

create policy "membro_select_own_record"
on public.membros
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'membro' and p.membro_id = membros.id
  )
);

create policy "admin_all_convites"
on public.convites
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_manage_own_igreja_convites"
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

create policy "filial_manage_own_filial_convites"
on public.convites
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = convites.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = convites.filial_id
  )
);

create policy "public_info_view_convite"
on public.convites
for select
to anon
using (true);

create policy "admin_all_grupos"
on public.grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_grupos"
on public.grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = grupos.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = grupos.igreja_id
  )
);

create policy "filial_all_own_grupos"
on public.grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = grupos.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = grupos.filial_id
  )
);

create policy "admin_all_lancamentos"
on public.lancamentos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_lancamentos"
on public.lancamentos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = lancamentos.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = lancamentos.igreja_id
  )
);

create policy "filial_all_own_lancamentos"
on public.lancamentos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = lancamentos.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = lancamentos.filial_id
  )
);

create policy "admin_all_eventos"
on public.eventos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_eventos"
on public.eventos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = eventos.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = eventos.igreja_id
  )
);

create policy "filial_all_own_eventos"
on public.eventos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = eventos.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = eventos.filial_id
  )
);

create policy "admin_all_escalas"
on public.escalas
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_escalas"
on public.escalas
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'master'
  )
);

create policy "filial_all_own_escalas"
on public.escalas
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'filial'
  )
);

create policy "membro_select_own_group_membership"
on public.membros_grupos
for select
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.membro_id = membros_grupos.membro_id
  )
);

create policy "admin_all_membros_grupos"
on public.membros_grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
)
with check (
  exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.papel = 'admin'
  )
);

create policy "master_all_igreja_membros_grupos"
on public.membros_grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    join public.grupos g on g.id = membros_grupos.grupo_id
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = g.igreja_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    join public.grupos g on g.id = membros_grupos.grupo_id
    where p.id = auth.uid() and p.papel = 'master' and p.igreja_id = g.igreja_id
  )
);

create policy "filial_all_own_membros_grupos"
on public.membros_grupos
for all
to authenticated
using (
  exists (
    select 1 from public.perfis p
    join public.grupos g on g.id = membros_grupos.grupo_id
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = g.filial_id
  )
)
with check (
  exists (
    select 1 from public.perfis p
    join public.grupos g on g.id = membros_grupos.grupo_id
    where p.id = auth.uid() and p.papel = 'filial' and p.filial_id = g.filial_id
  )
);

