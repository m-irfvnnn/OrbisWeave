'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/account-state'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

export type Project = {
  id: string
  name: string
  description: string
  phase: string
  organizationId: string | null
  createdAt: string
  updatedAt: string
}

type Workspace = Pick<Tables<'organizations'>, 'id' | 'name'>
type ProjectInput = { name: string; description: string; phase?: string }

type WorkspaceState = {
  workspace: Workspace | null
  projects: Project[]
  loading: boolean
  error: string | null
  createProject: (input: ProjectInput) => Promise<Project>
  updateProject: (id: string, input: Partial<ProjectInput>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  reloadProjects: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

function toProject(row: Tables<'projects'>): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    phase: row.stage,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function workspaceName(displayName: string) {
  return `${displayName}'s Workspace`
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, account } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjectsFor = useCallback(async (workspaceId: string) => {
    const { data, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', workspaceId)
      .order('updated_at', { ascending: false })
    if (projectsError) throw projectsError
    setProjects((data ?? []).map(toProject))
  }, [])

  useEffect(() => {
    if (!user) {
      setWorkspace(null)
      setProjects([])
      setError(null)
      setLoading(false)
      return
    }

    let active = true
    const initialize = async () => {
      setLoading(true)
      setError(null)
      try {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.uid,
          email: user.email,
          display_name: user.displayName?.trim() || account.name,
          avatar_url: user.photoURL,
        })
        if (profileError) throw profileError

        let { data: personalWorkspace, error: workspaceError } = await supabase
          .from('organizations')
          .select('id,name')
          .eq('owner_id', user.uid)
          .eq('is_personal', true)
          .maybeSingle()
        if (workspaceError) throw workspaceError

        if (!personalWorkspace) {
          const created = await supabase
            .from('organizations')
            .insert({ owner_id: user.uid, name: workspaceName(account.name), is_personal: true })
            .select('id,name')
            .single()
          if (created.error?.code === '23505') {
            const existing = await supabase
              .from('organizations')
              .select('id,name')
              .eq('owner_id', user.uid)
              .eq('is_personal', true)
              .single()
            if (existing.error) throw existing.error
            personalWorkspace = existing.data
          } else if (created.error) {
            throw created.error
          } else {
            personalWorkspace = created.data
          }
        }

        if (!active) return
        setWorkspace(personalWorkspace)
        await loadProjectsFor(personalWorkspace.id)
      } catch (initializationError) {
        if (!active) return
        setError(initializationError instanceof Error ? initializationError.message : 'Unable to load your workspace.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void initialize()
    return () => { active = false }
  }, [account.email, account.name, account.photoURL, loadProjectsFor, user])

  const reloadProjects = useCallback(async () => {
    if (!workspace) return
    await loadProjectsFor(workspace.id)
  }, [loadProjectsFor, workspace])

  const createProject = useCallback(async (input: ProjectInput) => {
    if (!user || !workspace) throw new Error('Sign in to create a project.')
    const { data, error: createError } = await supabase.from('projects').insert({
      owner_id: user.uid,
      organization_id: workspace.id,
      name: input.name,
      description: input.description || null,
      stage: input.phase ?? 'Idea',
    }).select('*').single()
    if (createError) throw createError
    const project = toProject(data)
    setProjects(current => [project, ...current])
    return project
  }, [user, workspace])

  const updateProject = useCallback(async (id: string, input: Partial<ProjectInput>) => {
    const values: { name?: string; description?: string | null; stage?: string } = {}
    if (input.name !== undefined) values.name = input.name
    if (input.description !== undefined) values.description = input.description || null
    if (input.phase !== undefined) values.stage = input.phase
    const { data, error: updateError } = await supabase.from('projects').update(values).eq('id', id).select('*').single()
    if (updateError) throw updateError
    const project = toProject(data)
    setProjects(current => current.map(item => item.id === id ? project : item))
    return project
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id)
    if (deleteError) throw deleteError
    setProjects(current => current.filter(project => project.id !== id))
  }, [])

  const value = useMemo(() => ({ workspace, projects, loading, error, createProject, updateProject, deleteProject, reloadProjects }), [workspace, projects, loading, error, createProject, updateProject, deleteProject, reloadProjects])
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const state = useContext(WorkspaceContext)
  if (!state) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return state
}
