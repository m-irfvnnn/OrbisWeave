'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from '@/components/account-state'
import {
  deleteProjectSuggestion,
  deletePromptTemplate,
  listProjectRoadmaps,
  listProjectSuggestions,
  listPromptTemplates,
  saveProjectRoadmap,
  saveProjectSuggestion,
  savePromptTemplate,
} from '@/lib/supabase/intelligence'
import type { Tables, TablesInsert } from '@/lib/supabase/types'

type AIState = {
  projectId: string | null
  promptTemplates: Tables<'prompt_templates'>[]
  suggestions: Tables<'project_suggestions'>[]
  roadmaps: Tables<'project_roadmaps'>[]
  roadmap: Tables<'project_roadmaps'> | null
  loading: boolean
  loadProjectIntelligence: (projectId: string) => Promise<void>
  savePrompt: (values: Omit<TablesInsert<'prompt_templates'>, 'owner_id'> & { id?: string }) => Promise<Tables<'prompt_templates'>>
  removePrompt: (id: string) => Promise<void>
  saveSuggestion: (values: Omit<TablesInsert<'project_suggestions'>, 'owner_id'> & { id?: string }) => Promise<Tables<'project_suggestions'>>
  removeSuggestion: (id: string) => Promise<void>
  saveRoadmap: (values: Omit<TablesInsert<'project_roadmaps'>, 'owner_id'> & { id?: string }) => Promise<Tables<'project_roadmaps'>>
}

const AIContext = createContext<AIState | null>(null)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [promptTemplates, setPromptTemplates] = useState<Tables<'prompt_templates'>[]>([])
  const [suggestions, setSuggestions] = useState<Tables<'project_suggestions'>[]>([])
  const [roadmaps, setRoadmaps] = useState<Tables<'project_roadmaps'>[]>([])
  const [roadmap, setRoadmap] = useState<Tables<'project_roadmaps'> | null>(null)
  const [loading, setLoading] = useState(false)

  const loadProjectIntelligence = useCallback(async (nextProjectId: string) => {
    setLoading(true)
    try {
      const [templates, nextSuggestions, nextRoadmap] = await Promise.all([
        listPromptTemplates(nextProjectId),
        listProjectSuggestions(nextProjectId),
        listProjectRoadmaps(nextProjectId),
      ])
      setProjectId(nextProjectId)
      setPromptTemplates(templates)
      setSuggestions(nextSuggestions)
      setRoadmaps(nextRoadmap)
      setRoadmap(nextRoadmap.find(item => item.status === 'current') ?? nextRoadmap[0] ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  const savePrompt = useCallback(async (values: Omit<TablesInsert<'prompt_templates'>, 'owner_id'> & { id?: string }) => {
    if (!user) throw new Error('Sign in to save prompt templates.')
    const template = await savePromptTemplate({ ...values, owner_id: user.uid })
    setPromptTemplates(current => [template, ...current.filter(item => item.id !== template.id)])
    return template
  }, [user])

  const removePrompt = useCallback(async (id: string) => {
    await deletePromptTemplate(id)
    setPromptTemplates(current => current.filter(item => item.id !== id))
  }, [])

  const saveSuggestion = useCallback(async (values: Omit<TablesInsert<'project_suggestions'>, 'owner_id'> & { id?: string }) => {
    if (!user) throw new Error('Sign in to save project suggestions.')
    const suggestion = await saveProjectSuggestion({ ...values, owner_id: user.uid })
    setSuggestions(current => [suggestion, ...current.filter(item => item.id !== suggestion.id)])
    return suggestion
  }, [user])

  const removeSuggestion = useCallback(async (id: string) => {
    await deleteProjectSuggestion(id)
    setSuggestions(current => current.filter(item => item.id !== id))
  }, [])

  const saveRoadmap = useCallback(async (values: Omit<TablesInsert<'project_roadmaps'>, 'owner_id'> & { id?: string }) => {
    if (!user) throw new Error('Sign in to save project roadmaps.')
    const nextRoadmap = await saveProjectRoadmap({ ...values, owner_id: user.uid })
    setRoadmaps(current => [nextRoadmap, ...current.filter(item => item.id !== nextRoadmap.id)])
    if (nextRoadmap.status === 'current') setRoadmap(nextRoadmap)
    return nextRoadmap
  }, [user])

  const value = useMemo(() => ({ projectId, promptTemplates, suggestions, roadmaps, roadmap, loading, loadProjectIntelligence, savePrompt, removePrompt, saveSuggestion, removeSuggestion, saveRoadmap }), [projectId, promptTemplates, suggestions, roadmaps, roadmap, loading, loadProjectIntelligence, savePrompt, removePrompt, saveSuggestion, removeSuggestion, saveRoadmap])
  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAI() {
  const state = useContext(AIContext)
  if (!state) throw new Error('useAI must be used within AIProvider')
  return state
}
