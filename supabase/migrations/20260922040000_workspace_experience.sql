alter table public.project_suggestions
drop constraint project_suggestions_status_check;

alter table public.project_suggestions
add constraint project_suggestions_status_check
check (status in ('pending', 'accepted', 'dismissed', 'archived'));

alter table public.project_roadmaps
add column description text,
add column status text not null default 'current'
check (status in ('current', 'archived'));

alter table public.project_roadmaps
drop constraint project_roadmaps_project_id_key;

create unique index project_roadmaps_one_current_per_project
on public.project_roadmaps(project_id)
where status = 'current';

create index project_roadmaps_project_id_updated_at_idx
on public.project_roadmaps(project_id, updated_at desc);
