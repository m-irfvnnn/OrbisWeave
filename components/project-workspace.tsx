'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Download, FileText, Lightbulb, Map, MessageSquare, Paperclip, Settings, Trash2, Upload, Workflow } from 'lucide-react'
import { useAI } from '@/components/ai-provider'
import { useConversations } from '@/components/conversations-provider'
import { useKnowledge } from '@/components/knowledge-provider'
import type { Project } from '@/components/workspace-state'
import type { Tables } from '@/lib/supabase/types'

export type ProjectSection = 'overview' | 'idea' | 'architecture' | 'resources' | 'milestones' | 'documents' | 'knowledge' | 'conversations' | 'suggestions' | 'roadmaps' | 'settings'

export const projectNavigation: Array<{ group: string; items: Array<{ id: ProjectSection; label: string }> }> = [
  { group: 'PROJECT', items: [{ id: 'overview', label: 'Overview' }] },
  { group: 'PLANNING', items: [{ id: 'idea', label: 'Idea' }, { id: 'architecture', label: 'Architecture' }, { id: 'resources', label: 'Resources' }, { id: 'milestones', label: 'Milestones' }] },
  { group: 'KNOWLEDGE', items: [{ id: 'documents', label: 'Documents' }, { id: 'knowledge', label: 'Knowledge Base' }] },
  { group: 'AI', items: [{ id: 'conversations', label: 'Conversations' }, { id: 'suggestions', label: 'Suggestions' }, { id: 'roadmaps', label: 'Roadmaps' }] },
  { group: 'SETTINGS', items: [{ id: 'settings', label: 'Project Settings' }] },
]

const stages = ['Idea', 'Architecture', 'Resources', 'Milestones']

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function EmptyState({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="workspace-empty"><strong>{title}</strong><p>{children}</p>{action}</div>
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="workspace-section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</div>
}

export function ProjectWorkspace({ project, section, setSection, ownerName, workspaceName, onEdit, onUpdate }: {
  project: Project
  section: ProjectSection
  setSection: (section: ProjectSection) => void
  ownerName: string
  workspaceName: string
  onEdit: () => void
  onUpdate: (values: { description?: string; phase?: string }) => Promise<void>
}) {
  const knowledge = useKnowledge()
  const conversations = useConversations()
  const ai = useAI()
  const uploadRef = useRef<HTMLInputElement>(null)
  const [idea, setIdea] = useState(project.description)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => setIdea(project.description), [project.description])
  useEffect(() => {
    void Promise.allSettled([
      knowledge.loadProjectKnowledge(project.id),
      conversations.loadProjectConversations(project.id),
      ai.loadProjectIntelligence(project.id),
    ])
  }, [project.id]) // Provider loaders are stable; reload only when the project changes.

  const stageIndex = Math.max(0, stages.indexOf(project.phase))
  const progress = Math.round(((stageIndex + 1) / stages.length) * 100)
  const resourceCount = ai.suggestions.filter(item => /resource|library|api|service|framework/i.test(`${item.kind} ${item.title}`)).length
  const roadmapStages = Array.isArray((ai.roadmap?.content as { stages?: unknown[] } | null)?.stages) ? (ai.roadmap?.content as { stages: unknown[] }).stages.length : 0
  const age = Math.max(0, Math.floor((Date.now() - new Date(project.createdAt).getTime()) / 86400000))
  const nextAction = !knowledge.documents.length ? 'Upload README.md' : !knowledge.chunks.length ? 'Review Existing Documentation' : !conversations.conversations.length ? 'Start a Project Conversation' : stageIndex === 0 ? 'Generate Architecture' : stageIndex === 1 ? 'Upload API Specification' : 'Continue Milestone Planning'
  const activities = useMemo(() => [
    { label: 'Project created', at: project.createdAt },
    ...knowledge.documents.slice(0, 2).map(item => ({ label: `${item.file_name} uploaded`, at: item.created_at })),
    ...conversations.conversations.slice(0, 2).map(item => ({ label: `Conversation started: ${item.title}`, at: item.created_at })),
    ...(ai.roadmap ? [{ label: 'Roadmap updated', at: ai.roadmap.updated_at }] : []),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5), [ai.roadmap, conversations.conversations, knowledge.documents, project.createdAt])

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setBusy(true)
    try {
      for (const file of files) await knowledge.uploadDocument(project.id, file)
    } finally { setBusy(false) }
  }
  const download = async (path: string) => { window.open(await knowledge.getDownloadUrl(path), '_blank', 'noopener,noreferrer') }
  const createConversation = async () => { await conversations.startConversation(project.id, { title: 'New project conversation' }); setSection('conversations') }
  const sendMessage = async () => {
    if (!message.trim() || !conversations.activeConversation) return
    await conversations.addMessage({ conversation_id: conversations.activeConversation.id, project_id: project.id, role: 'user', content: message.trim() })
    setMessage('')
  }

  const uploadButton = <button className="secondary-action" disabled={busy} onClick={()=>uploadRef.current?.click()}><Upload size={16}/>{busy?'Uploading…':'Upload Documents'}</button>

  return <section className="page-view workspace-page">
    <input ref={uploadRef} hidden multiple type="file" accept=".md,.markdown,.pdf,image/*,.txt,.json,.yaml,.yml" onChange={event=>{void uploadFiles([...(event.target.files??[])]);event.currentTarget.value=''}}/>
    <header className="workspace-hero"><div><span className="eyebrow">PROJECT WORKSPACE</span><h1>{project.name}</h1><p>{project.description || 'Add a project description to give your workspace context.'}</p><div className="workspace-meta"><span>Owner <b>{ownerName}</b></span><span>Workspace <b>{workspaceName}</b></span><span>Created <b>{formatDate(project.createdAt)}</b></span><span>Updated <b>{formatDate(project.updatedAt)}</b></span></div></div><div className="workspace-actions">{section!=='documents'&&uploadButton}<button className="lime-button" onClick={onEdit}><Settings size={16}/>Project Settings</button></div></header>

    {section==='overview'&&<div className="workspace-stack">
      <div className="workspace-panel"><SectionHeader eyebrow="PROJECT PROGRESS" title={`${progress}% complete`} description={`Current stage: ${project.phase}`}/><div className="workspace-progress">{stages.map((stage,index)=><div className={`workspace-stage ${index<stageIndex?'complete':index===stageIndex?'current':'pending'}`} key={stage}><i/><strong>{stage}</strong><span>{index<stageIndex?'Completed':index===stageIndex?'Current':'Pending'}</span></div>)}</div></div>
      <div className="workspace-recommendation"><Lightbulb size={20}/><div><span className="eyebrow">NEXT RECOMMENDED ACTION</span><h3>{nextAction}</h3><p>Build the next layer of project context so OrbisWeave can provide more useful guidance.</p></div><button className="secondary-action" onClick={()=>nextAction.includes('Upload')?uploadRef.current?.click():setSection(nextAction.includes('Architecture')?'architecture':'conversations')}>Continue</button></div>
      <div className="workspace-stats">{[['Documents',knowledge.documents.length],['Knowledge Chunks',knowledge.chunks.length],['AI Conversations',conversations.conversations.length],['Suggestions',ai.suggestions.length],['Roadmaps',ai.roadmaps.length],['Resources',resourceCount],['Milestones',roadmapStages],['Project Age',`${age}d`]].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
      <div className="workspace-panel"><SectionHeader eyebrow="PROJECT HISTORY" title="Recent Activity" description="The latest context added to this project."/>{activities.length?<div className="activity-list">{activities.map(item=><div key={`${item.label}-${item.at}`}><i/><span><strong>{item.label}</strong><small>{formatDate(item.at)}</small></span></div>)}</div>:<EmptyState title="No activity yet">Create context by uploading a document or starting a conversation.</EmptyState>}</div>
    </div>}

    {section==='idea'&&<div className="workspace-panel"><SectionHeader eyebrow="PLANNING" title="Idea" description="Define the problem, audience, and outcome before designing the system." action={<button className="secondary-action" onClick={()=>setIdea(project.description)}>Generate Ideas</button>}/><div className="workspace-form-grid"><label>IDEA DESCRIPTION<textarea value={idea} onChange={event=>setIdea(event.target.value)} placeholder="Describe the idea and desired outcome…"/></label><article><h3>Business Goals</h3><p>{project.description||'Add measurable business goals for this project.'}</p></article><article><h3>Problem Statement</h3><p>Clarify the user problem this project will solve.</p></article><article><h3>Target Users</h3><p>Identify the people and teams who will use the final system.</p></article></div><div className="workspace-actions"><button className="lime-button" onClick={()=>onUpdate({description:idea})}>Save</button></div></div>}

    {section==='architecture'&&<div className="workspace-stack"><div className="workspace-panel"><SectionHeader eyebrow="PLANNING" title="Architecture" description="System design, technical context, and architecture evidence." action={<button className="secondary-action"><Workflow size={16}/>Generate Architecture</button>}/><h3>Architecture Summary</h3><p>{project.phase==='Architecture'?project.description||'Architecture work is currently in progress.':'Advance the project to Architecture when the idea is ready.'}</p><h3>System Design</h3><EmptyState title="No system design captured yet">Upload an architecture PDF, diagram, or API specification to begin.</EmptyState></div><div className="workspace-panel"><h3>Architecture Files</h3>{knowledge.documents.filter(item=>/architecture|diagram|\.pdf$/i.test(item.file_name)).map(item=><DocumentRow key={item.id} item={item} download={download} remove={knowledge.removeDocument}/>)}</div><div className="workspace-panel"><h3>Suggested Improvements</h3>{ai.suggestions.length?ai.suggestions.slice(0,4).map(item=><p key={item.id}>{item.title}</p>):<p className="muted-copy">Suggestions will appear as project context grows.</p>}</div></div>}

    {section==='resources'&&<div className="workspace-panel"><SectionHeader eyebrow="PLANNING" title="Resources" description="Frameworks, libraries, APIs, and external services required by the project."/>{resourceCount?<div className="workspace-card-grid">{ai.suggestions.filter(item=>/resource|library|api|service|framework/i.test(`${item.kind} ${item.title}`)).map(item=><article key={item.id}><BookOpen/><h3>{item.title}</h3><p>{item.description||item.kind}</p></article>)}</div>:<EmptyState title="No resources identified yet">Add technical documentation or API specifications to build the resource plan.</EmptyState>}</div>}

    {section==='milestones'&&<div className="workspace-panel"><SectionHeader eyebrow="PLANNING" title="Milestones" description="Development phases, progress, and future tasks."/>{ai.roadmap?<RoadmapCard roadmap={ai.roadmap}/>:<EmptyState title="No milestone roadmap yet">Create a roadmap to organize development phases and future tasks.</EmptyState>}</div>}

    {section==='documents'&&<div className="workspace-panel documents-panel"><SectionHeader eyebrow="KNOWLEDGE" title="Documents" description="README files, PDFs, diagrams, API specs, images, and design documents." action={uploadButton}/><div className="document-drop-zone" role="button" tabIndex={0} onClick={()=>uploadRef.current?.click()} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();uploadRef.current?.click()}}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void uploadFiles([...event.dataTransfer.files])}}><Upload size={22}/><div><strong>Drop project documents here</strong><span>or use Upload Documents to browse your files</span></div></div><div className="document-guidance"><article><FileText/><span><strong>README.md</strong><small>Project context and setup</small></span></article><article><Workflow/><span><strong>Architecture PDF</strong><small>System diagrams and decisions</small></span></article><article><Paperclip/><span><strong>API Specification</strong><small>Endpoints and integrations</small></span></article><article><BookOpen/><span><strong>Design Files</strong><small>Images and visual references</small></span></article></div><div className="document-support"><span>Markdown, PDF, images, text, and diagrams</span><span>Maximum file size: 50 MB</span><span>Private to project members</span></div>{knowledge.loading?<p className="muted-copy document-loading">Loading documents…</p>:knowledge.documents.length?<div className="document-list"><h3>Project Documents</h3>{knowledge.documents.map(item=><DocumentRow key={item.id} item={item} download={download} remove={knowledge.removeDocument}/>)}</div>:<div className="documents-empty"><strong>No documents uploaded yet.</strong><span>Start with a README to give OrbisWeave useful project context.</span></div>}</div>}

    {section==='knowledge'&&<div className="workspace-panel"><SectionHeader eyebrow="KNOWLEDGE" title="Knowledge Base" description="Searchable document chunks prepared for contextual AI understanding."/>{knowledge.chunks.length?<div className="knowledge-list">{knowledge.chunks.map(chunk=><article key={chunk.id}><span>Chunk {chunk.chunk_index+1}</span><p>{chunk.content}</p><small>{chunk.token_count??'—'} tokens</small></article>)}</div>:<EmptyState title="Knowledge base is empty">Upload and process project documents to create reusable context.</EmptyState>}</div>}

    {section==='conversations'&&<div className="workspace-panel"><SectionHeader eyebrow="AI" title="Conversations" description="Project-scoped discussion history. AI generation will be connected later." action={<button className="lime-button" onClick={createConversation}><MessageSquare size={16}/>New Conversation</button>}/><div className="conversation-layout"><div className="conversation-list">{conversations.conversations.map(item=><button className={conversations.activeConversation?.id===item.id?'active':''} key={item.id} onClick={()=>conversations.selectConversation(item)}><strong>{item.title}</strong><small>{formatDate(item.updated_at)}</small></button>)}{!conversations.conversations.length&&<p className="muted-copy">No conversations yet.</p>}</div><div className="message-panel">{conversations.activeConversation?<><div className="message-list">{conversations.messages.map(item=><div className={`message ${item.role}`} key={item.id}><small>{item.role}</small><p>{item.content}</p></div>)}</div><div className="message-compose"><textarea value={message} onChange={event=>setMessage(event.target.value)} placeholder="Add a message to this conversation…"/><button className="lime-button" onClick={sendMessage}>Save Message</button><button className="text-action" onClick={()=>conversations.removeConversation(conversations.activeConversation!.id)}>Delete Conversation</button></div></>:<EmptyState title="Select a conversation">Choose a conversation or create a new one to view its messages.</EmptyState>}</div></div></div>}

    {section==='suggestions'&&<div className="workspace-panel"><SectionHeader eyebrow="AI" title="Suggestions" description="Contextual recommendations stored for this project."/>{ai.suggestions.length?<div className="suggestion-list">{ai.suggestions.map(item=>{const priority=(item.payload as {priority?:string}|null)?.priority||'Normal';return <article key={item.id}><div><span className="eyebrow">{item.kind} · {priority} priority</span><h3>{item.title}</h3><p>{item.description||'No additional description.'}</p><small>Status: {item.status} · Created {formatDate(item.created_at)}</small></div><div className="workspace-actions"><button className="secondary-action" onClick={()=>ai.saveSuggestion({...item,status:'accepted'})}>Accept</button><button className="secondary-action" onClick={()=>ai.saveSuggestion({...item,status:'dismissed'})}>Reject</button><button className="text-action" onClick={()=>ai.saveSuggestion({...item,status:'archived'})}>Archive</button></div></article>})}</div>:<EmptyState title="No suggestions yet">Suggestions will appear after documents and conversations add project context.</EmptyState>}</div>}

    {section==='roadmaps'&&<div className="workspace-panel"><SectionHeader eyebrow="AI" title="Roadmaps" description="Stored plans for moving this project from idea to delivery."/>{ai.roadmaps.length?<div className="workspace-stack">{ai.roadmaps.map(item=><RoadmapCard key={item.id} roadmap={item}/>)}</div>:<EmptyState title="No roadmap created yet">A project roadmap will appear here when one is created.</EmptyState>}</div>}

    {section==='settings'&&<div className="workspace-panel"><SectionHeader eyebrow="PROJECT" title="Settings" description="Manage project identity and lifecycle."/><div className="workspace-settings"><article><span>Name</span><strong>{project.name}</strong></article><article><span>Stage</span><strong>{project.phase}</strong></article><article><span>Workspace</span><strong>{workspaceName}</strong></article></div><button className="lime-button" onClick={onEdit}><Settings size={16}/>Edit Project</button></div>}
  </section>
}

function DocumentRow({ item, download, remove }: { item: ReturnType<typeof useKnowledge>['documents'][number]; download: (path: string) => Promise<void>; remove: (item: ReturnType<typeof useKnowledge>['documents'][number]) => Promise<void> }) {
  return <article className="document-row"><FileText/><div><strong>{item.file_name}</strong><span>{item.mime_type||'Document'} · {Math.max(1,Math.round(item.size_bytes/1024))} KB · Uploaded {formatDate(item.created_at)} · Updated {formatDate(item.updated_at)}</span></div><button className="text-action" onClick={()=>download(item.storage_path)}><Download size={15}/>Download</button><button className="text-action" onClick={()=>remove(item)}><Trash2 size={15}/>Delete</button></article>
}

function RoadmapCard({ roadmap }: { roadmap: Tables<'project_roadmaps'> }) {
  const content = roadmap.content as { stages?: unknown[] }
  return <article className="roadmap-card"><Map/><div><span className="eyebrow">{roadmap.status} · VERSION {roadmap.version}</span><h3>{roadmap.title}</h3><p>{roadmap.description||'Project roadmap stored and ready for future AI planning.'}</p><small>{Array.isArray(content.stages)?`${content.stages.length} phases`:'Current roadmap'}</small></div></article>
}
