-- Firebase third-party JWTs are verified by Supabase, but do not carry the
-- Supabase-specific `role: authenticated` claim. They therefore execute as
-- the `anon` Postgres role. Authorize both roles only when a verified JWT has
-- a non-null subject, then retain the original subject ownership checks.

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;
drop policy if exists "organizations_select_member" on public.organizations;
drop policy if exists "organizations_insert_own" on public.organizations;
drop policy if exists "organizations_update_owner" on public.organizations;
drop policy if exists "organizations_delete_owner" on public.organizations;
drop policy if exists "organization_members_select_related" on public.organization_members;
drop policy if exists "organization_members_insert_owner" on public.organization_members;
drop policy if exists "organization_members_update_owner" on public.organization_members;
drop policy if exists "organization_members_delete_owner" on public.organization_members;
drop policy if exists "projects_select_related" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "profiles_select_own"
on public.profiles for select
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and id = (select private.current_user_id())
);

create policy "profiles_insert_own"
on public.profiles for insert
to anon, authenticated
with check (
  (select private.current_user_id()) is not null
  and id = (select private.current_user_id())
);

create policy "profiles_update_own"
on public.profiles for update
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and id = (select private.current_user_id())
)
with check (
  (select private.current_user_id()) is not null
  and id = (select private.current_user_id())
);

create policy "profiles_delete_own"
on public.profiles for delete
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and id = (select private.current_user_id())
);

create policy "organizations_select_member"
on public.organizations for select
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and (
    owner_id = (select private.current_user_id())
    or (select private.is_organization_member(id))
  )
);

create policy "organizations_insert_own"
on public.organizations for insert
to anon, authenticated
with check (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
);

create policy "organizations_update_owner"
on public.organizations for update
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
)
with check (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
);

create policy "organizations_delete_owner"
on public.organizations for delete
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
);

create policy "organization_members_select_related"
on public.organization_members for select
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and (
    user_id = (select private.current_user_id())
    or (select private.is_organization_owner(organization_id))
  )
);

create policy "organization_members_insert_owner"
on public.organization_members for insert
to anon, authenticated
with check (
  (select private.current_user_id()) is not null
  and (select private.is_organization_owner(organization_id))
);

create policy "organization_members_update_owner"
on public.organization_members for update
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and (select private.is_organization_owner(organization_id))
)
with check (
  (select private.current_user_id()) is not null
  and (select private.is_organization_owner(organization_id))
);

create policy "organization_members_delete_owner"
on public.organization_members for delete
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and (select private.is_organization_owner(organization_id))
);

create policy "projects_select_related"
on public.projects for select
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and (
    owner_id = (select private.current_user_id())
    or (
      organization_id is not null
      and (select private.is_organization_member(organization_id))
    )
  )
);

create policy "projects_insert_own"
on public.projects for insert
to anon, authenticated
with check (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
  and (
    organization_id is null
    or (select private.is_organization_member(organization_id))
  )
);

create policy "projects_update_own"
on public.projects for update
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
)
with check (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
  and (
    organization_id is null
    or (select private.is_organization_member(organization_id))
  )
);

create policy "projects_delete_own"
on public.projects for delete
to anon, authenticated
using (
  (select private.current_user_id()) is not null
  and owner_id = (select private.current_user_id())
);

grant usage on schema private to anon;
grant execute on function private.current_user_id() to anon;
grant execute on function private.is_organization_owner(uuid) to anon;
grant execute on function private.is_organization_member(uuid) to anon;

grant select, insert, update, delete on public.profiles to anon;
grant select, insert, update, delete on public.organizations to anon;
grant select, insert, update, delete on public.organization_members to anon;
grant select, insert, update, delete on public.projects to anon;
