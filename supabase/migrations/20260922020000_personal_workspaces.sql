alter table public.organizations
add column is_personal boolean not null default false;

create unique index organizations_one_personal_workspace_per_owner
on public.organizations(owner_id)
where is_personal;
