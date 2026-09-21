alter table public.knowledge_documents
add constraint knowledge_documents_identity_key unique (id, project_id, owner_id);

alter table public.knowledge_chunks
add constraint knowledge_chunks_document_scope_fkey
foreign key (document_id, project_id, owner_id)
references public.knowledge_documents(id, project_id, owner_id)
on delete cascade;

alter table public.ai_conversations
add constraint ai_conversations_identity_key unique (id, project_id, owner_id);

alter table public.ai_messages
add constraint ai_messages_conversation_scope_fkey
foreign key (conversation_id, project_id, owner_id)
references public.ai_conversations(id, project_id, owner_id)
on delete cascade;
