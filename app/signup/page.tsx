'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthButton, AuthDivider, AuthField, AuthHeading, AuthShell } from '@/components/auth-shell'
import { GoogleIcon } from '@/components/google-icon'

export default function SignupPage() {
  const [notice, setNotice] = useState('')
  const unavailable = () => setNotice('Authentication is not connected yet. Your information has not been submitted or stored.')

  return <AuthShell eyebrow="Create your account" title="Start building." description="Create an OrbisWeave account to carry your projects from idea to implementation."><AuthHeading title="Create your account" description="Start building with OrbisWeave"/><form className="auth-form" onSubmit={event=>{event.preventDefault();unavailable()}}><AuthField label="Name" name="name" autoComplete="name" placeholder="Your name" required/><AuthField label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/><AuthField label="Password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" required/>{notice&&<p className="auth-notice" role="status">{notice}</p>}<AuthButton>Create Account</AuthButton></form><AuthDivider/><button className="auth-google" type="button" onClick={unavailable}><GoogleIcon/>Continue with Google</button><p className="auth-footer">Already have an account? <Link href="/login">Sign in</Link></p></AuthShell>
}
