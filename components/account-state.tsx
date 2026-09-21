'use client'

import { createContext, useContext, useMemo, useState } from 'react'

export type AccountIdentity = {
  status: 'signed-in' | 'guest'
  name: string
  plan: string | null
  initials: string
}

const signedInAccount: AccountIdentity = {
  status: 'signed-in',
  name: 'Mohammad Irfan',
  plan: 'Starter Plan',
  initials: 'MI',
}

const guestAccount: AccountIdentity = {
  status: 'guest',
  name: 'Guest',
  plan: null,
  initials: 'G',
}

type AccountState = {
  account: AccountIdentity
  signOut: () => void
}

const AccountStateContext = createContext<AccountState | null>(null)

export function TemporaryAccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountIdentity>(signedInAccount)
  const value = useMemo(() => ({ account, signOut: () => setAccount(guestAccount) }), [account])

  return <AccountStateContext.Provider value={value}>{children}</AccountStateContext.Provider>
}

export function useAccount() {
  const state = useContext(AccountStateContext)
  if (!state) throw new Error('useAccount must be used within TemporaryAccountProvider')
  return state
}
