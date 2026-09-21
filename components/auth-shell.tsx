import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SVG-gqI415gAmZMMFMUJ8bbVnkWEJMH9TW.png'

export function AuthShell({ children, eyebrow, title, description }: { children: ReactNode; eyebrow: string; title: string; description: string }) {
  return <main className="auth-page"><div className="auth-shell"><header className="auth-header"><Link href="/" className="auth-brand"><img src={logo} alt=""/><span>orbisweave</span></Link><Link href="/" className="auth-back"><ArrowLeft size={14}/>Back to OrbisWeave</Link></header><div className="auth-layout"><section className="auth-intro"><span className="auth-eyebrow"><i/>{eyebrow}</span><h1>{title}</h1><p>{description}</p><span className="auth-accent"/></section><section className="auth-card">{children}</section></div></div></main>
}

export function AuthHeading({ title, description }: { title: string; description: string }) {
  return <div className="auth-heading"><h2>{title}</h2><p>{description}</p></div>
}

export function AuthField({ label, ...props }: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>) {
  return <label className="auth-field"><span>{label}</span><input {...props}/></label>
}

export function AuthButton({ children, ...props }: { children: ReactNode } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  return <button className="auth-primary" type="submit" {...props}>{children}</button>
}

export function AuthDivider() {
  return <div className="auth-divider"><span/><small>or</small><span/></div>
}
