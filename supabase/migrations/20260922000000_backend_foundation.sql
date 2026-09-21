create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function private.current_user_id()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'sub'
$$;

create table public.profiles (
  id text primary key default private.current_user_id(),
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_id_not_empty check (length(trim(id)) > 0)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default private.current_user_id(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_owner_id_not_empty check (length(trim(owner_id)) > 0),
  constraint organizations_name_not_empty check (length(trim(name)) > 0)
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id text not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint organization_members_user_id_not_empty check (length(trim(user_id)) > 0),
  constraint organization_members_role_valid check (role in ('owner', 'admin', 'member'))
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default private.current_user_id(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  stage text not null default 'Idea',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_owner_id_not_empty check (length(trim(owner_id)) > 0),
  constraint projects_name_not_empty check (length(trim(name)) > 0),
  constraint projects_stage_valid check (stage in ('Idea', 'Architecture', 'Resources', 'Milestones', 'Development', 'Tests', 'Deployment'))
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index projects_owner_id_idx on public.projects(owner_id);
create index projects_organization_id_idx on public.projects(organization_id);

create or replace function private.is_organization_owner(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations
    where id = target_organization_id
      and owner_id = (select auth.jwt() ->> 'sub')
  )
$$;

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = (select auth.jwt() ->> 'sub')
  )
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger organizations_add_owner
after insert on public.organizations
for each row execute function private.add_organization_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = (select private.current_user_id()));

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = (select private.current_user_id()));

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = (select private.current_user_id()))
with check (id = (select private.current_user_id()));

create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using (id = (select private.current_user_id()));

create policy "organizations_select_member"
on public.organizations for select
to authenticated
using (
  owner_id = (select private.current_user_id())
  or (select private.is_organization_member(id))
);

create policy "organizations_insert_own"
on public.organizations for insert
to authenticated
with check (owner_id = (select private.current_user_id()));

create policy "organizations_update_owner"
on public.organizations for update
to authenticated
using (owner_id = (select private.current_user_id()))
with check (owner_id = (select private.current_user_id()));

create policy "organizations_delete_owner"
on public.organizations for delete
to authenticated
using (owner_id = (select private.current_user_id()));

create policy "organization_members_select_related"
on public.organization_members for select
to authenticated
using (
  user_id = (select private.current_user_id())
  or (select private.is_organization_owner(organization_id))
);

create policy "organization_members_insert_owner"
on public.organization_members for insert
to authenticated
with check ((select private.is_organization_owner(organization_id)));

create policy "organization_members_update_owner"
on public.organization_members for update
to authenticated
using ((select private.is_organization_owner(organization_id)))
with check ((select private.is_organization_owner(organization_id)));

create policy "organization_members_delete_owner"
on public.organization_members for delete
to authenticated
using ((select private.is_organization_owner(organization_id)));

create policy "projects_select_related"
on public.projects for select
to authenticated
using (
  owner_id = (select private.current_user_id())
  or (
    organization_id is not null
    and (select private.is_organization_member(organization_id))
  )
);

create policy "projects_insert_own"
on public.projects for insert
to authenticated
with check (
  owner_id = (select private.current_user_id())
  and (
    organization_id is null
    or (select private.is_organization_member(organization_id))
  )
);

create policy "projects_update_own"
on public.projects for update
to authenticated
using (owner_id = (select private.current_user_id()))
with check (
  owner_id = (select private.current_user_id())
  and (
    organization_id is null
    or (select private.is_organization_member(organization_id))
  )
);

create policy "projects_delete_own"
on public.projects for delete
to authenticated
using (owner_id = (select private.current_user_id()));

revoke all on schema private from public;
revoke execute on all functions in schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.current_user_id() to authenticated;
grant execute on function private.is_organization_owner(uuid) to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
