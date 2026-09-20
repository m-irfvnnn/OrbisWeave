'use client'

import { useState } from 'react'
import {
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Folder,
  GitBranch,
  Grid2X2,
  Home,
  Link2,
  MoreHorizontal,
  Paperclip,
  Plus,
  Rocket,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  UserRound,
  Workflow,
  X,
  Zap,
} from 'lucide-react'

const logoMark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SVG-gqI415gAmZMMFMUJ8bbVnkWEJMH9TW.png'
const chatLogoMark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SVG-Sp1Xi0lUD77k83d5ZiIFjxrPpZlXZA.png'
const logoWordmark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background%2BShadow-EgoMpWC9kweOcroJhJ3MMdNCARSS6L.png'
const deepseekLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/deepseek-logo-TrLl386065-SBLspFPrpPCSrsQPLsYGVA7G1tA8p6.webp'
const geminiLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-google-gemini-8CE4hMd4br1HamAWNcMpRGAi1Y98DI.webp'

type View = 'home' | 'projects' | 'workspace' | 'idea' | 'architecture' | 'resources' | 'milestones' | 'development' | 'tests' | 'deployment' | 'templates' | 'integrations' | 'usage' | 'settings'

const navItems: { label: string; icon: typeof Home; view: View }[] = [
  { label: 'Home', icon: Home, view: 'home' },
  { label: 'Projects', icon: Folder, view: 'projects' },
  { label: 'Templates', icon: Grid2X2, view: 'templates' },
  { label: 'Integrations', icon: Link2, view: 'integrations' },
  { label: 'Usage & Costs', icon: SlidersHorizontal, view: 'usage' },
  { label: 'Settings', icon: Settings, view: 'settings' },
]

const projects = [
  { name: 'Lead Qualification Agent', phase: 'Building', color: 'lime', description: 'Inbound lead qualification and routing', progress: 57, updated: '2 min ago' },
  { name: 'Customer Support Agent', phase: 'Planning', color: 'blue', description: 'AI support triage for shared inboxes', progress: 24, updated: 'Yesterday' },
  { name: 'Internal Knowledge Bot', phase: 'Testing', color: 'white', description: 'Answers from company knowledge', progress: 86, updated: '3 days ago' },
  { name: 'Data Enrichment Flow', phase: 'Building', color: 'lime', description: 'Enrich and sync new prospects', progress: 41, updated: '5 days ago' },
]

function Logo({ wordmark = true, chat = false }: { wordmark?: boolean; chat?: boolean }) {
  return wordmark ? (
    <div className="brand-lockup" aria-label="OrbisWeave">
      <img src={logoMark} alt="" className="brand-mark" />
      <span>orbisweave</span>
    </div>
  ) : (
    <img src={chat ? chatLogoMark : logoMark} alt="OrbisWeave" className="hero-mark" />
  )
}

function Sidebar({ view, setView, projectOpen, setProjectOpen }: { view: View; setView: (view: View) => void; projectOpen: boolean; setProjectOpen: (open: boolean) => void }) {
  return (
    <aside className="sidebar">
      <Logo />
      <button className="new-project" onClick={() => setView('home')}><Plus size={19} /><span>New Project</span><kbd>⌘ N</kbd></button>
      <div className="sidebar-scroll">
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon, view: itemView }) => (
          <button key={label} className={`nav-item ${view === itemView ? 'active' : ''}`} onClick={() => setView(itemView)}>
            <Icon size={19} strokeWidth={1.7} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="recent-heading"><span>Recent Projects</span><Search size={16} /></div>
      <div className="recent-projects">
        {projects.map((project) => (
          <button key={project.name} className="recent-project" onClick={() => { setProjectOpen(true); setView('workspace') }}>
            <span className={`status-dot ${project.color}`} />
            <span>{project.name}</span>
          </button>
        ))}
      </div>
      {projectOpen && (
        <div className="project-tree">
          <button className="tree-title" onClick={() => setView('workspace')}><ChevronDown size={15} /> Lead Qualification Agent</button>
          <span className="tree-label">PLAN</span>
{(['Idea', 'Architecture', 'Resources', 'Milestones'] as const).map((item, i) => <button key={item} className={`tree-item ${i === 1 ? 'selected' : ''}`} onClick={() => setView(item.toLowerCase() as View)}><span className={i < 2 ? 'tree-check' : ''}>{i < 2 ? '✓' : '○'}</span>{item}</button>)}
      <span className="tree-label">BUILD</span>
      {(['Development', 'Tests & Review', 'Deployment'] as const).map(item => <button key={item} className="tree-item" onClick={() => setView(item === 'Tests & Review' ? 'tests' : item.toLowerCase() as View)}><span>○</span>{item}</button>)}
        </div>
      )}
      </div>
      <div className="profile">
        <div className="avatar">MI</div><div className="profile-copy"><strong>Mohammad Irfan</strong><span>Starter Plan</span></div><MoreHorizontal size={18} />
      </div>
    </aside>
  )
}

function TopBar() {
  return <header className="topbar"><div className="top-actions"><button className="circle-button" aria-label="Search"><Search size={18} /></button><button className="circle-button" aria-label="Help"><CircleHelp size={18} /></button><button className="circle-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><span className="top-divider" /><div className="top-user"><div className="avatar small">MI</div><span>Mohammad Irfan</span><ChevronDown size={16} /></div></div></header>
}

function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState({ provider: 'DeepSeek', name: 'DeepSeek V4.1 Flash', logo: deepseekLogo, detail: 'Fast · Agentic · 1M context' })
  const models = [
    { provider: 'DeepSeek', name: 'DeepSeek V4.1 Flash', logo: deepseekLogo, detail: 'Fast · Agentic · 1M context' },
    { provider: 'DeepSeek', name: 'DeepSeek V4 Pro', logo: deepseekLogo, detail: 'Advanced · Complex reasoning · 1M context' },
    { provider: 'Gemini', name: 'Gemini 3.1 Flash-Lite', logo: geminiLogo, detail: 'Fast · Efficient · Multimodal' },
  ]
  return <div className="model-wrap"><button className="model-select" onClick={() => setOpen(!open)} aria-expanded={open}><img src={selected.logo} alt={selected.provider} /><span><small>{selected.provider}</small><strong>{selected.name}</strong></span><ChevronDown size={16} /></button>{open && <div className="model-menu"><div className="model-menu-title">AI models</div>{models.map(model => <button key={model.name} className={`model-option ${selected.name === model.name ? 'selected' : ''}`} onClick={() => { setSelected(model); setOpen(false) }}><img src={model.logo} alt="" /><span><strong>{model.name}</strong><small>{model.detail}</small></span>{selected.name === model.name && <Check size={15} />}</button>)}</div>}</div>
}

function PromptComposer({ project = false }: { project?: boolean }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  return <div className={`composer ${project ? 'project-composer' : ''}`}>
    <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={project ? 'Ask OrbisWeave about this project...' : 'Describe your automation or AI agent idea...'} aria-label={project ? 'Ask OrbisWeave about this project' : 'Describe your automation or AI agent idea'} />
    <div className="composer-footer"><div className="composer-tools"><button className="tool-icon" aria-label="Attach file"><Paperclip size={18} /></button><button className="tool-chip"><GlobeIcon /> Web Search</button><button className="tool-chip"><FileText size={16} /> Deep Research</button></div><div className="composer-actions">{!project && <ModelSelector />}<button className="send-button" aria-label="Send" onClick={() => { setSent(true); setTimeout(() => setSent(false), 1800) }}>{sent ? <Check size={20} /> : <Send size={20} />}</button></div></div>
  </div>
}

function GlobeIcon() { return <span className="globe-icon">◎</span> }

function HomeView({ setView }: { setView: (view: View) => void }) {
  return <section className="home-view"><div className="hero-orbit" /><div className="home-content"><Logo wordmark={false} chat /><h1>What do you want to <em>build?</em></h1><p>Turn your ideas into powerful AI agents and automations.</p><PromptComposer /><div className="shortcut"><kbd>⌘</kbd><kbd>K</kbd><span>to create a new project</span></div></div><div className="quote"><span /><p>“Ideas become reality when they are woven together.”<br /><b>— OrbisWeave</b></p><span /></div></section>
}

function ProjectsView({ setView }: { setView: (view: View) => void }) {
  const [filter, setFilter] = useState('All')
  return <section className="page-view"><div className="page-heading"><div><span className="eyebrow">WORKSPACE LIBRARY</span><h1>Projects</h1><p>Your AI systems, from first idea to production.</p></div><button className="lime-button" onClick={() => setView('home')}><Plus size={18} /> New Project</button></div><div className="project-toolbar"><div className="search-field"><Search size={17} /><input placeholder="Search projects..." /></div><div className="filters">{['All', 'Planning', 'Building', 'Testing', 'Deployed'].map(item => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div></div><div className="project-list">{projects.filter(p => filter === 'All' || p.phase === filter).map(project => <button className="project-row" key={project.name} onClick={() => setView('workspace')}><div className="project-icon"><Workflow size={20} /></div><div className="project-info"><strong>{project.name}</strong><span>{project.description}</span></div><div className="project-phase"><span className={`status-dot ${project.color}`} />{project.phase}<small>Milestone {Math.max(1, Math.round(project.progress / 15))} / 7</small></div><div className="progress-wrap"><div className="progress-label"><span>Progress</span><b>{project.progress}%</b></div><div className="progress"><i style={{ width: `${project.progress}%` }} /></div></div><div className="updated">{project.updated}<ChevronDown size={16} /></div></button>)}</div></section>
}

function WorkspaceView() {
  const [approved, setApproved] = useState(false)
  return <section className="page-view workspace-view"><div className="workspace-heading"><div><div className="breadcrumb"><span>Projects</span><span>/</span><strong>Lead Qualification Agent</strong></div><h1>Lead Qualification Agent</h1><p>AI-powered inbound lead qualification and routing</p></div><div className="role-selector"><span>AI ROLE</span><button><Sparkles size={15} /> Architect <ChevronDown size={15} /></button></div></div><div className="phase-strip">{['Idea', 'Architecture', 'Resources', 'Milestones'].map((phase, i) => <div className={i === 1 ? 'current' : i < 1 ? 'done' : ''} key={phase}><span>{i < 1 ? '✓' : i === 1 ? '●' : '○'}</span>{phase}</div>)}</div><div className="workspace-grid"><div className="conversation"><div className="ai-message"><div className="ai-avatar"><Sparkles size={16} /></div><div><span className="message-meta">ORBISWEAVE · ARCHITECT</span><p>I&apos;ve reviewed your project and identified three improvements before we finalize the architecture.</p><ol><li><b>Define qualification signals</b><span>Make scoring criteria explicit for consistent decisions.</span></li><li><b>Add human review fallback</b><span>Route uncertain leads to your team instead of losing context.</span></li><li><b>Confirm CRM ownership</b><span>Assign qualified opportunities to the right HubSpot owner.</span></li></ol><div className="message-actions"><button onClick={() => setApproved(true)}>Review Suggestions</button><button className={approved ? 'approved' : 'primary'} onClick={() => setApproved(true)}>{approved ? '✓ Idea Approved' : 'Approve & Continue'}</button></div></div></div><PromptComposer project /></div><aside className="workspace-aside"><div className="aside-card"><div className="card-label">CURRENT PHASE</div><div className="phase-big"><span className="blue-pulse" />Architecture</div><p>Shape the system before development begins.</p><div className="mini-progress"><span style={{ width: '29%' }} /></div><small>2 of 7 phases complete</small></div><div className="aside-card"><div className="card-label">PROJECT KNOWLEDGE</div>{['REQUIREMENTS.md', 'ARCHITECTURE.md', 'MILESTONES.md'].map((file, i) => <div className="file-row" key={file}><FileText size={16} /><span>{file}</span><b>{i === 0 ? 'Updated' : 'Ready'}</b></div>)}<button className="text-button">View all documents <ChevronDown size={14} /></button></div></aside></div></section>
}

function WorkflowView({ view }: { view: View }) {
  const [approved, setApproved] = useState(false)
  const phase = view === 'workspace' ? 'architecture' : view
  const titles: Record<string, string> = { idea: 'Idea', architecture: 'Architecture', resources: 'Resources', milestones: 'Milestones', development: 'Development', tests: 'Tests & Review', deployment: 'Deployment' }
  const descriptions: Record<string, string> = { idea: 'Transform the rough prompt into an approved project definition.', architecture: 'Translate the approved idea into a clear technical system design.', resources: 'Confirm everything required to build and operate the project.', milestones: 'Turn the plan into an implementation-ready development roadmap.', development: 'A controlled implementation handoff based on approved milestones.', tests: 'Validate the current milestone against tests and acceptance criteria.', deployment: 'Prepare the approved project for production readiness.' }
  const title = titles[phase] || 'Architecture'
  const sections: Record<string, string[]> = { idea: ['Original Idea', 'AI Analysis', 'Missing Requirements', 'Improvements', 'Risks / Constraints', 'Refined Idea', 'Requirements', 'Final Project Specification'], architecture: ['System Overview', 'Architecture Diagram', 'System Components', 'Tech Stack', 'Data Flow', 'Integrations', 'Database / Data Layer', 'API / Interface Layer', 'AI / Agent Architecture', 'Security Considerations', 'Architecture Decisions', 'Alternatives'], resources: ['Technology', 'AI / Models', 'APIs & Services', 'Database & Storage', 'Infrastructure', 'Integrations', 'Development Tools', 'Dependencies', 'Environment Variables', 'Readiness Status', 'Cost Estimate', 'Effort / Resource Estimate'], milestones: ['Development Roadmap', 'M1 Foundation', 'M2 Database & Authentication', 'M3 AI Backend', 'M4 Core Workflow', 'M5 Integrations', 'M6 Testing', 'M7 Deployment'], development: ['Current Milestone', 'Implementation Plan', 'Implementation Instructions', 'Expected Changes', 'Test Requirements', 'Acceptance Criteria'], tests: ['Current Milestone', 'Required Tests', 'Acceptance Criteria', 'Review Checklist', 'Issues Found', 'Status'], deployment: ['Deployment Target', 'Deployment Readiness', 'Environment Variables', 'Deployment Instructions', 'Pre-Deployment Checklist', 'Post-Deployment Checklist'] }
  const details: Record<string, string> = { 'System Overview': 'A lead qualification agent receives inbound leads, evaluates fit and intent, enriches context, and routes qualified opportunities to the CRM.', 'Architecture Diagram': 'User → Frontend → Backend / API → AI Agent Layer → Database → External Services', 'Original Idea': 'Build an AI-powered inbound lead qualification and routing workflow for the sales team.', 'Refined Idea': 'An auditable agent that scores inbound leads, explains its decision, and routes uncertain cases to human review.', 'Readiness Status': '8 resources identified · 5 ready · 2 required · 1 optional', 'Development Roadmap': 'Idea → Architecture → Resources → Milestones → Development → Test → Deploy' }
  return <section className="page-view workflow-view"><div className="workspace-heading"><div><div className="breadcrumb"><span>Projects</span><span>/</span><strong>Lead Qualification Agent</strong></div><h1>{title}</h1><p>{descriptions[phase] || descriptions.architecture}</p></div><div className="role-selector"><span>PROJECT PHASE</span><button><Sparkles size={15} /> {title} <ChevronDown size={15} /></button></div></div><div className="phase-strip">{['Idea', 'Architecture', 'Resources', 'Milestones'].map((item, i) => { const activeIndex = ['idea', 'architecture', 'resources', 'milestones'].indexOf(phase); return <div className={i === activeIndex ? 'current' : i < activeIndex ? 'done' : ''} key={item}><span>{i < activeIndex ? '✓' : i === activeIndex ? '●' : '○'}</span>{item}</div> })}</div><div className="workflow-header"><span className="eyebrow">{title.toUpperCase()} · {phase === 'idea' || phase === 'architecture' || phase === 'resources' || phase === 'milestones' ? 'READY FOR REVIEW' : 'WORKSPACE'}</span><div className="workflow-actions"><button onClick={() => setApproved(false)}>Edit</button><button className={approved ? 'approved' : 'primary'} onClick={() => setApproved(true)}>{approved ? '✓ Approved' : `Approve ${title}`}</button></div></div><div className="workflow-grid">{sections[phase].map((section, index) => <article className={`workflow-card ${section === 'Architecture Diagram' || section === 'Development Roadmap' ? 'wide' : ''}`} key={section}><div className="card-label">{section.toUpperCase()}</div><h2>{section}</h2><p>{details[section] || (section === 'Security Considerations' ? 'Authentication, authorization, secrets, API security, data access, and human approval boundaries.' : section === 'Environment Variables' ? 'DATABASE_URL · DEEPSEEK_API_KEY · HUBSPOT_ACCESS_TOKEN · APP_URL' : section === 'Status' ? 'Ready · Needs Fix · Blocked' : 'Structured project guidance, responsibilities, dependencies, deliverables, and acceptance criteria for this stage.' )}</p>{(phase === 'resources' || phase === 'milestones' || phase === 'tests' || phase === 'deployment') && <div className="workflow-list"><span><Check size={14} /> {index % 2 ? 'Required' : 'Ready'}</span><span>{phase === 'milestones' ? 'Estimated effort · 2–4 days' : 'Owner · OrbisWeave'}</span></div>}</article>)}</div></section>
}

function SimpleView({ view }: { view: Extract<View, 'templates' | 'integrations' | 'usage' | 'settings'> }) {
  const config = { templates: ['Templates', 'Start with a proven agent blueprint.', 'AI Agents', 'Sales', 'Marketing', 'Operations'], integrations: ['Integrations', 'Connect the tools your projects rely on.', 'AI', 'Development', 'CRM', 'Communication'], usage: ['Usage & Costs', 'Understand how your workspace is being used.', 'AI Spend', 'Tokens', 'Agent Runs', 'Successful Runs'], settings: ['Settings', 'Workspace preferences and model controls.', 'Profile', 'Workspace', 'AI & Models', 'Security'] }[view]
  return <section className="page-view simple-view"><div className="page-heading"><div><span className="eyebrow">ORBISWEAVE</span><h1>{config[0]}</h1><p>{config[1]}</p></div></div><div className="simple-grid">{config.slice(2).map((item, i) => <div className="simple-card" key={item}><div className="simple-icon">{i % 2 === 0 ? <Zap size={20} /> : <Settings size={20} />}</div><div><strong>{item}</strong><p>{view === 'templates' ? 'Explore curated building blocks for your next workflow.' : view === 'integrations' ? 'Manage availability for this workspace.' : view === 'usage' ? 'This month&apos;s workspace activity.' : 'Configure how OrbisWeave works for you.'}</p></div><ChevronDown size={17} /></div>)}</div></section>
}

export default function Page() {
  const [view, setView] = useState<View>('home')
  const [projectOpen, setProjectOpen] = useState(false)
  return <main className="product-app-shell"><Sidebar view={view} setView={setView} projectOpen={projectOpen} setProjectOpen={setProjectOpen} /><div className="main-shell"><TopBar />{view === 'home' && <HomeView setView={setView} />}{view === 'projects' && <ProjectsView setView={setView} />}{['workspace', 'idea', 'architecture', 'resources', 'milestones', 'development', 'tests', 'deployment'].includes(view) && <WorkflowView view={view} />}{['templates', 'integrations', 'usage', 'settings'].includes(view) && <SimpleView view={view} />}</div></main>
}

// The supplied dashboard reference depicts the product's black workspace, restrained glow, centered prompt, and persistent project sidebar. The logo and DeepSeek images above are the authoritative uploaded assets.
