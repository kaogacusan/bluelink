import { createContext, useContext } from 'react'
import type { FullPerson, Membership, MyOrg } from '../types'

export type Theme = 'light' | 'dark'
export type ComposeKind = 'post' | 'ask' | 'work' | 'opp' | 'event'

export interface AppState {
  me: FullPerson
  setMe: (me: FullPerson) => void
  connections: number
  orgs: MyOrg[]
  membership: Membership
  isAdmin: boolean
  reloadMe: () => void
  badges: number
  refreshBadges: () => void
  compose: (kind?: ComposeKind, orgId?: string) => void
  toast: (text: string) => void
  theme: Theme
  setTheme: (t: Theme) => void
  signOut: () => void
}

export const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp needs AppContext')
  return ctx
}
