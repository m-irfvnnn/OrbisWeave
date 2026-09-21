'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from '@/components/account-state'
import {
  createDocumentDownloadUrl,
  deleteKnowledgeDocument,
  listKnowledgeChunks,
  listKnowledgeDocuments,
  replaceKnowledgeChunks,
  updateKnowledgeDocument,
  uploadKnowledgeDocument,
} from '@/lib/supabase/intelligence'
import type { Json, Tables, TablesUpdate } from '@/lib/supabase/types'

type KnowledgeState = {
  projectId: string | null
  documents: Tables<'knowledge_documents'>[]
  chunks: Tables<'knowledge_chunks'>[]
  loading: boolean
  error: string | null
  loadProjectKnowledge: (projectId: string) => Promise<void>
  uploadDocument: (projectId: string, file: File, metadata?: Json) => Promise<Tables<'knowledge_documents'>>
  updateDocument: (id: string, values: TablesUpdate<'knowledge_documents'>) => Promise<Tables<'knowledge_documents'>>
  removeDocument: (document: Tables<'knowledge_documents'>) => Promise<void>
  getDownloadUrl: (storagePath: string, expiresIn?: number) => Promise<string>
  replaceChunks: (documentId: string, projectId: string, chunks: Array<{ content: string; tokenCount?: number; metadata?: Json }>) => Promise<void>
}

const KnowledgeContext = createContext<KnowledgeState | null>(null)

export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Tables<'knowledge_documents'>[]>([])
  const [chunks, setChunks] = useState<Tables<'knowledge_chunks'>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjectKnowledge = useCallback(async (nextProjectId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [nextDocuments, nextChunks] = await Promise.all([listKnowledgeDocuments(nextProjectId), listKnowledgeChunks(nextProjectId)])
      setProjectId(nextProjectId)
      setDocuments(nextDocuments)
      setChunks(nextChunks)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load project knowledge.')
      throw loadError
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(async (nextProjectId: string, file: File, metadata: Json = {}) => {
    if (!user) throw new Error('Sign in to upload project documents.')
    const document = await uploadKnowledgeDocument(nextProjectId, user.uid, file, metadata)
    if (projectId === nextProjectId) setDocuments(current => [document, ...current])
    return document
  }, [projectId, user])

  const updateDocument = useCallback(async (id: string, values: TablesUpdate<'knowledge_documents'>) => {
    const document = await updateKnowledgeDocument(id, values)
    setDocuments(current => current.map(item => item.id === id ? document : item))
    return document
  }, [])

  const removeDocument = useCallback(async (document: Tables<'knowledge_documents'>) => {
    await deleteKnowledgeDocument(document)
    setDocuments(current => current.filter(item => item.id !== document.id))
    setChunks(current => current.filter(chunk => chunk.document_id !== document.id))
  }, [])

  const replaceChunks = useCallback(async (documentId: string, nextProjectId: string, nextChunks: Array<{ content: string; tokenCount?: number; metadata?: Json }>) => {
    if (!user) throw new Error('Sign in to process project documents.')
    const saved = await replaceKnowledgeChunks(documentId, nextProjectId, user.uid, nextChunks)
    if (projectId === nextProjectId) setChunks(current => [...current.filter(chunk => chunk.document_id !== documentId), ...saved])
  }, [projectId, user])

  const value = useMemo(() => ({ projectId, documents, chunks, loading, error, loadProjectKnowledge, uploadDocument, updateDocument, removeDocument, getDownloadUrl: createDocumentDownloadUrl, replaceChunks }), [projectId, documents, chunks, loading, error, loadProjectKnowledge, uploadDocument, updateDocument, removeDocument, replaceChunks])
  return <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>
}

export function useKnowledge() {
  const state = useContext(KnowledgeContext)
  if (!state) throw new Error('useKnowledge must be used within KnowledgeProvider')
  return state
}
