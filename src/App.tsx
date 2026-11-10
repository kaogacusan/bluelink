import { useCallback, useEffect, useMemo, useState } from 'react'
import { Shell } from './components/Shell'
import { Composer } from './components/Composer'
import { Landing } from './screens/Landing'
import { Onboarding, needsSetup } from './screens/Onboarding'
import { Feed } from './screens/Feed'
import { People } from './screens/People'
import { Profile } from './screens/Profile'
import { EditProfile } from './screens/EditProfile'
import { Inbox } from './screens/Inbox'
import { Orgs } from './screens/Orgs'
import { OrgPage } from './screens/Org'
import { EditOrg, NewOrg } from './screens/OrgEdit'
import { Join } from './screens/Join'
import { Admin } from './screens/Admin'
import { Legal } from './screens/Legal'
import { api, session } from './lib/api'
import { AppContext, type AppState, type ComposeKind, type Theme } from './lib/app'
import { connectLive, useLive } from './lib/live'
import { useRoute, type Route } from './lib/router'
import { save } from './lib/storage'
import { LogoMark } from './components/Logo'
import type { FullPerson, Membership, MyOrg } from './types'

export default function App() {
  const route = useRoute()
  const [token, setToken] = useState(session.token)
  // There is no theme switch, so everyone gets light.
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => session.subscribe(() => setToken(session.token)), [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070c1f' : '#ffffff')
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    save('ui-theme', t)
  }, [])

  // The Terms and the Privacy Notice are open to everyone, signed in or not.
  if (route.page === 'legal') return <Legal doc={route.doc} />
  if (!token) return <Landing />
  return <SignedIn key={token} token={token} theme={theme} setTheme={setTheme} />
}

function SignedIn({ token, theme, setTheme }: { token: string; theme: Theme; setTheme: (t: Theme) => void }) {
  const [me, setMe] = useState<FullPerson | null | undefined>(undefined)
  const [connections, setConnections] = useState(0)
  const [orgs, setOrgs] = useState<MyOrg[]>([])
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [failed, setFailed] = useState('')
  const signOut = useCallback(() => session.set(null), [])

  const loadMe = useCallback(() => {
    api<{ user: FullPerson | null; connections: number; orgs: MyOrg[]; membership: Membership; isAdmin: boolean }>('/api/me')
      .then((r) => {
        setMe(r.user)
        setConnections(r.connections)
        setOrgs(r.orgs)
        setMembership(r.membership)
        setIsAdmin(r.isAdmin)
        setFailed('')
      })
      .catch((e) => setFailed(e.message))
  }, [])

  useEffect(loadMe, [loadMe])
  // The server says the membership is not active (it ran out, or a payment was rejected).
  useEffect(() => {
    window.addEventListener('bl:membership', loadMe)
    return () => window.removeEventListener('bl:membership', loadMe)
  }, [loadMe])

  if (me === undefined || !membership)
    return (
      <div className="boot">
        <LogoMark size={44} />
        {failed && (
          <>
            <p>{failed}</p>
            <button className="btn btn-outline" onClick={loadMe}>
              Try again
            </button>
          </>
        )}
      </div>
    )
  // New people, and anyone with an unfinished profile, set it up before they see the app.
  if (me === null || needsSetup(me)) return <Onboarding me={me} onSaved={(u) => (setMe(u), loadMe())} onSignOut={signOut} />
  if (!membership.active) return <Join firstName={me.name.split(' ')[0]} onJoined={loadMe} onSignOut={signOut} />
  return <Main token={token} me={me} setMe={setMe} connections={connections} orgs={orgs} membership={membership} isAdmin={isAdmin} reloadMe={loadMe} theme={theme} setTheme={setTheme} signOut={signOut} />
}

interface MainProps {
  token: string
  me: FullPerson
  setMe: (me: FullPerson) => void
  connections: number
  orgs: MyOrg[]
  membership: Membership
  isAdmin: boolean
  reloadMe: () => void
  theme: Theme
  setTheme: (t: Theme) => void
  signOut: () => void
}

function Main({ token, me, setMe, connections, orgs, membership, isAdmin, reloadMe, theme, setTheme, signOut }: MainProps) {
  const route = useRoute()
  const [badges, setBadges] = useState(0)
  const [composing, setComposing] = useState<{ kind: ComposeKind; orgId?: string } | null>(null)
  const [toastMsg, setToastMsg] = useState<{ id: number; text: string } | null>(null)

  const refreshBadges = useCallback(() => {
    api<{ inbox: number }>('/api/badges')
      .then((r) => setBadges(r.inbox))
      .catch(() => {})
  }, [])

  useEffect(() => connectLive(token), [token])
  useEffect(refreshBadges, [refreshBadges])
  useLive((e) => {
    if (e.type === 'inbox' || e.type === 'message') refreshBadges()
    if (e.type === 'inbox' || e.type === 'org' || e.type === 'membership') reloadMe()
  })

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3200)
    return () => clearTimeout(t)
  }, [toastMsg])

  const pageKey = route.page === 'inbox' ? 'inbox' : JSON.stringify(route)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pageKey])

  const app: AppState = useMemo(
    () => ({
      me,
      setMe,
      connections,
      orgs,
      membership,
      isAdmin,
      reloadMe,
      badges,
      refreshBadges,
      compose: (kind = 'post', orgId) => setComposing({ kind, orgId }),
      toast: (text) => setToastMsg({ id: Date.now(), text }),
      theme,
      setTheme,
      signOut,
    }),
    [me, setMe, connections, orgs, membership, isAdmin, reloadMe, badges, refreshBadges, theme, setTheme, signOut],
  )

  return (
    <AppContext.Provider value={app}>
      <Shell route={route}>
        <div className="page" key={pageKey}>
          <Page route={route} />
        </div>
      </Shell>
      {composing && <Composer kind={composing.kind} orgId={composing.orgId} onClose={() => setComposing(null)} />}
      {toastMsg && (
        <div className="toast" key={toastMsg.id} role="status">
          {toastMsg.text}
        </div>
      )}
    </AppContext.Provider>
  )
}

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'people':
      return <People />
    case 'orgs':
      return <Orgs />
    case 'businesses':
      return <Orgs type="business" />
    case 'org':
      return <OrgPage id={route.id} biz={route.biz} />
    case 'newOrg':
      return <NewOrg biz={route.biz} />
    case 'editOrg':
      return <EditOrg id={route.id} />
    case 'user':
      return <Profile id={route.id} />
    case 'inbox':
      return <Inbox id={route.id} />
    case 'me':
      return <Profile />
    case 'edit':
      return <EditProfile />
    case 'admin':
      return <Admin tab={route.tab} />
    case 'legal':
      return <Legal doc={route.doc} />
    default:
      return <Feed kind={route.kind} />
  }
}
