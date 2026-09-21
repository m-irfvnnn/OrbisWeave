create extension if not exists vector with schema extensions;

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_count integer check (token_count is null or token_count >= 0),
  embedding extensions.vector,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  title text not null default 'New conversation',
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  model text,
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  name text not null,
  description text,
  system_prompt text,
  user_prompt text not null,
  variables jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  kind text not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_roadmaps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  owner_id text not null default private.current_user_id(),
  title text not null default 'Project Roadmap',
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_documents_project_id_idx on public.knowledge_documents(project_id);
create index knowledge_chunks_document_id_idx on public.knowledge_chunks(document_id);
create index knowledge_chunks_project_id_idx on public.knowledge_chunks(project_id);
create index ai_conversations_project_id_updated_at_idx on public.ai_conversations(project_id, updated_at desc);
create index ai_messages_conversation_id_created_at_idx on public.ai_messages(conversation_id, created_at);
create index prompt_templates_project_id_idx on public.prompt_templates(project_id);
create index project_suggestions_project_id_status_idx on public.project_suggestions(project_id, status);

create or replace function private.owns_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = target_project_id
      and owner_id = (select auth.jwt() ->> 'sub')
  )
$$;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects
    where id = target_project_id
      and (
        owner_id = (select auth.jwt() ->> 'sub')
        or (
          organization_id is not null
          and private.is_organization_member(organization_id)
        )
      )
  )
$$;

create or replace function private.owns_project_storage_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
  current_subject text;
begin
  path_parts := storage.foldername(object_name);
  current_subject := auth.jwt() ->> 'sub';
  if current_subject is null or array_length(path_parts, 1) < 2 then
    return false;
  end if;
  return path_parts[1] = current_subject
    and private.owns_project(path_parts[2]::uuid);
exception when others then
  return false;
end;
$$;

create trigger knowledge_documents_set_updated_at before update on public.knowledge_documents
for each row execute function private.set_updated_at();
create trigger ai_conversations_set_updated_at before update on public.ai_conversations
for each row execute function private.set_updated_at();
create trigger prompt_templates_set_updated_at before update on public.prompt_templates
for each row execute function private.set_updated_at();
create trigger project_suggestions_set_updated_at before update on public.project_suggestions
for each row execute function private.set_updated_at();
create trigger project_roadmaps_set_updated_at before update on public.project_roadmaps
for each row execute function private.set_updated_at();

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.project_suggestions enable row level security;
alter table public.project_roadmaps enable row level security;

create policy "knowledge_documents_select_project" on public.knowledge_documents for select to anon, authenticated
using ((select private.current_user_id()) is not null and (select private.can_access_project(project_id)));
create policy "knowledge_documents_insert_owner" on public.knowledge_documents for insert to anon, authenticated
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));
create policy "knowledge_documents_update_owner" on public.knowledge_documents for update to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)))
with check (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));
create policy "knowledge_documents_delete_owner" on public.knowledge_documents for delete to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));

create policy "knowledge_chunks_select_project" on public.knowledge_chunks for select to anon, authenticated
using ((select private.current_user_id()) is not null and (select private.can_access_project(project_id)));
create policy "knowledge_chunks_insert_owner" on public.knowledge_chunks for insert to anon, authenticated
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));
create policy "knowledge_chunks_update_owner" on public.knowledge_chunks for update to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)))
with check (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));
create policy "knowledge_chunks_delete_owner" on public.knowledge_chunks for delete to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.owns_project(project_id)));

create policy "ai_conversations_own" on public.ai_conversations for all to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)))
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)));
create policy "ai_messages_own" on public.ai_messages for all to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)))
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)));
create policy "prompt_templates_own" on public.prompt_templates for all to anon, authenticated
using (owner_id = (select private.current_user_id()) and (project_id is null or (select private.can_access_project(project_id))))
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (project_id is null or (select private.can_access_project(project_id))));
create policy "project_suggestions_own" on public.project_suggestions for all to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)))
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)));
create policy "project_roadmaps_own" on public.project_roadmaps for all to anon, authenticated
using (owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)))
with check ((select private.current_user_id()) is not null and owner_id = (select private.current_user_id()) and (select private.can_access_project(project_id)));

grant execute on function private.owns_project(uuid) to anon, authenticated;
grant execute on function private.can_access_project(uuid) to anon, authenticated;
grant execute on function private.owns_project_storage_path(text) to anon, authenticated;
grant select, insert, update, delete on public.knowledge_documents to anon, authenticated;
grant select, insert, update, delete on public.knowledge_chunks to anon, authenticated;
grant select, insert, update, delete on public.ai_conversations to anon, authenticated;
grant select, insert, update, delete on public.ai_messages to anon, authenticated;
grant select, insert, update, delete on public.prompt_templates to anon, authenticated;
grant select, insert, update, delete on public.project_suggestions to anon, authenticated;
grant select, insert, update, delete on public.project_roadmaps to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-documents', 'project-documents', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "project_documents_select" on storage.objects for select to anon, authenticated
using (bucket_id = 'project-documents' and (select private.owns_project_storage_path(name)));
create policy "project_documents_insert" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'project-documents' and (select private.owns_project_storage_path(name)));
create policy "project_documents_update" on storage.objects for update to anon, authenticated
using (bucket_id = 'project-documents' and (select private.owns_project_storage_path(name)))
with check (bucket_id = 'project-documents' and (select private.owns_project_storage_path(name)));
create policy "project_documents_delete" on storage.objects for delete to anon, authenticated
using (bucket_id = 'project-documents' and (select private.owns_project_storage_path(name)));
