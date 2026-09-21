import { supabase } from '@/lib/supabase/client'
import type { Json, Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types'

export const PROJECT_DOCUMENTS_BUCKET = 'project-documents'

function safeFileName(name: string) {
  return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document'
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function requireData<T>(data: T | null): T {
  if (data === null) throw new Error('Supabase returned no data for the requested operation.')
  return data
}

export async function listKnowledgeDocuments(projectId: string) {
  const result = await supabase.from('knowledge_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  throwIfError(result.error)
  return result.data ?? []
}

export async function uploadKnowledgeDocument(projectId: string, ownerId: string, file: File, metadata: Json = {}) {
  const storagePath = `${ownerId}/${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
  const upload = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).upload(storagePath, file, { contentType: file.type || undefined, upsert: false })
  throwIfError(upload.error)

  const document = await supabase.from('knowledge_documents').insert({
    project_id: projectId,
    owner_id: ownerId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    metadata,
  }).select('*').single()

  if (document.error || !document.data) {
    await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([storagePath])
    throw new Error(document.error?.message ?? 'Document metadata was not created.')
  }
  return document.data
}

export async function updateKnowledgeDocument(id: string, values: TablesUpdate<'knowledge_documents'>) {
  const result = await supabase.from('knowledge_documents').update(values).eq('id', id).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function deleteKnowledgeDocument(document: Tables<'knowledge_documents'>) {
  const storageResult = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).remove([document.storage_path])
  throwIfError(storageResult.error)
  const databaseResult = await supabase.from('knowledge_documents').delete().eq('id', document.id)
  throwIfError(databaseResult.error)
}

export async function createDocumentDownloadUrl(storagePath: string, expiresIn = 300) {
  const result = await supabase.storage.from(PROJECT_DOCUMENTS_BUCKET).createSignedUrl(storagePath, expiresIn)
  throwIfError(result.error)
  return requireData(result.data).signedUrl
}

export async function listKnowledgeChunks(projectId: string) {
  const result = await supabase.from('knowledge_chunks').select('*').eq('project_id', projectId).order('chunk_index')
  throwIfError(result.error)
  return result.data ?? []
}

export async function replaceKnowledgeChunks(documentId: string, projectId: string, ownerId: string, chunks: Array<{ content: string; tokenCount?: number; metadata?: Json }>) {
  const removed = await supabase.from('knowledge_chunks').delete().eq('document_id', documentId)
  throwIfError(removed.error)
  if (!chunks.length) return []
  const rows: TablesInsert<'knowledge_chunks'>[] = chunks.map((chunk, index) => ({
    document_id: documentId,
    project_id: projectId,
    owner_id: ownerId,
    chunk_index: index,
    content: chunk.content,
    token_count: chunk.tokenCount ?? null,
    metadata: chunk.metadata ?? {},
  }))
  const result = await supabase.from('knowledge_chunks').insert(rows).select('*')
  throwIfError(result.error)
  return result.data ?? []
}

export async function listConversations(projectId: string) {
  const result = await supabase.from('ai_conversations').select('*').eq('project_id', projectId).order('updated_at', { ascending: false })
  throwIfError(result.error)
  return result.data ?? []
}

export async function createConversation(values: TablesInsert<'ai_conversations'>) {
  const result = await supabase.from('ai_conversations').insert(values).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function updateConversation(id: string, values: TablesUpdate<'ai_conversations'>) {
  const result = await supabase.from('ai_conversations').update(values).eq('id', id).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function deleteConversation(id: string) {
  const result = await supabase.from('ai_conversations').delete().eq('id', id)
  throwIfError(result.error)
}

export async function listMessages(conversationId: string) {
  const result = await supabase.from('ai_messages').select('*').eq('conversation_id', conversationId).order('created_at')
  throwIfError(result.error)
  return result.data ?? []
}

export async function createMessage(values: TablesInsert<'ai_messages'>) {
  const result = await supabase.from('ai_messages').insert(values).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function listPromptTemplates(projectId: string) {
  const result = await supabase.from('prompt_templates').select('*').or(`project_id.eq.${projectId},project_id.is.null`).order('created_at', { ascending: false })
  throwIfError(result.error)
  return result.data ?? []
}

export async function savePromptTemplate(values: TablesInsert<'prompt_templates'> & { id?: string }) {
  if (values.id) {
    const { id, ...update } = values
    const result = await supabase.from('prompt_templates').update(update).eq('id', id).select('*').single()
    throwIfError(result.error)
    return requireData(result.data)
  }
  const result = await supabase.from('prompt_templates').insert(values).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function deletePromptTemplate(id: string) {
  const result = await supabase.from('prompt_templates').delete().eq('id', id)
  throwIfError(result.error)
}

export async function listProjectSuggestions(projectId: string) {
  const result = await supabase.from('project_suggestions').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
  throwIfError(result.error)
  return result.data ?? []
}

export async function saveProjectSuggestion(values: TablesInsert<'project_suggestions'> & { id?: string }) {
  if (values.id) {
    const { id, ...update } = values
    const result = await supabase.from('project_suggestions').update(update).eq('id', id).select('*').single()
    throwIfError(result.error)
    return requireData(result.data)
  }
  const result = await supabase.from('project_suggestions').insert(values).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function deleteProjectSuggestion(id: string) {
  const result = await supabase.from('project_suggestions').delete().eq('id', id)
  throwIfError(result.error)
}

export async function getProjectRoadmap(projectId: string) {
  const result = await supabase.from('project_roadmaps').select('*').eq('project_id', projectId).maybeSingle()
  throwIfError(result.error)
  return requireData(result.data)
}

export async function saveProjectRoadmap(values: TablesInsert<'project_roadmaps'>) {
  const result = await supabase.from('project_roadmaps').upsert(values, { onConflict: 'project_id' }).select('*').single()
  throwIfError(result.error)
  return requireData(result.data)
}
