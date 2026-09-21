'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthButton, AuthDivider, AuthField, AuthHeading, AuthShell } from '@/components/auth-shell'
import { GoogleIcon } from '@/components/google-icon'

export default function LoginPage() {
  const [notice, setNotice] = useState('')
  const unavailable = () => setNotice('Authentication is not connected yet. Your information has not been submitted or stored.')

  return <AuthShell eyebrow="Welcome back" title="Build with clarity." description="Return to your OrbisWeave workspace and continue shaping your AI systems."><AuthHeading title="Welcome back" description="Sign in to continue to OrbisWeave"/><form className="auth-form" onSubmit={event=>{event.preventDefault();unavailable()}}><AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/><AuthField label="Password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required/>{notice&&<p className="auth-notice" role="status">{notice}</p>}<AuthButton>Sign In</AuthButton></form><AuthDivider/><button className="auth-google" type="button" onClick={unavailable}><GoogleIcon/>Continue with Google</button><p className="auth-footer">Don&apos;t have an account? <Link href="/signup">Create account</Link></p></AuthShell>
}
